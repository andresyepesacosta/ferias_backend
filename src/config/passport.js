const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

// Serialización de usuario para sesiones
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
  } catch (error) {
    done(error, null);
  }
});

// Estrategia de Google OAuth - Solo se carga si hay credenciales válidas
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'placeholder_google_client_id') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar usuario existente
    const [existingUser] = await pool.execute(
      'SELECT * FROM users WHERE provider = ? AND provider_id = ?',
      ['google', profile.id]
    );

    if (existingUser.length > 0) {
      // Usuario ya existe, actualizar tokens
      await pool.execute(
        `UPDATE oauth_tokens 
         SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND provider = ?`,
        [accessToken, refreshToken, new Date(Date.now() + 3600000), existingUser[0].id, 'google']
      );
      return done(null, existingUser[0]);
    }

    // Buscar por email si existe usuario con email local
    const [emailUser] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [profile.emails[0].value]
    );

    if (emailUser.length > 0) {
      // Enlazar cuenta existente con Google
      await pool.execute(
        `UPDATE users 
         SET provider = ?, provider_id = ?, avatar_url = ?, email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        ['google', profile.id, profile.photos[0].value, emailUser[0].id]
      );

      // Guardar tokens OAuth
      await pool.execute(
        `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [emailUser[0].id, 'google', accessToken, refreshToken, new Date(Date.now() + 3600000)]
      );

      return done(null, emailUser[0]);
    }

    // Crear nuevo usuario
    const [newUser] = await pool.execute(
      `INSERT INTO users (name, email, provider, provider_id, avatar_url, email_verified, email_verified_at)
       VALUES (?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)`,
      [profile.displayName, profile.emails[0].value, 'google', profile.id, profile.photos[0].value]
    );

    // Crear configuración por defecto
    await pool.execute(
      'INSERT INTO user_settings (user_id) VALUES (?)',
      [newUser.insertId]
    );

    // Guardar tokens OAuth
    await pool.execute(
      `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [newUser.insertId, 'google', accessToken, refreshToken, new Date(Date.now() + 3600000)]
    );

    const [createdUser] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [newUser.insertId]
    );

    done(null, createdUser[0]);
  } catch (error) {
    done(error, null);
  }
  }));
}

// Estrategia de Facebook OAuth - Solo se carga si hay credenciales válidas
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET && 
    process.env.FACEBOOK_APP_ID !== 'placeholder_facebook_app_id') {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'picture.type(large)']
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar usuario existente
    const [existingUser] = await pool.execute(
      'SELECT * FROM users WHERE provider = ? AND provider_id = ?',
      ['facebook', profile.id]
    );

    if (existingUser.length > 0) {
      // Usuario ya existe, actualizar tokens
      await pool.execute(
        `UPDATE oauth_tokens 
         SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND provider = ?`,
        [accessToken, refreshToken, new Date(Date.now() + 3600000), existingUser[0].id, 'facebook']
      );
      return done(null, existingUser[0]);
    }

    // Buscar por email si existe
    const email = profile.emails ? profile.emails[0].value : null;
    if (email) {
      const [emailUser] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (emailUser.length > 0) {
        // Enlazar cuenta existente con Facebook
        await pool.execute(
          `UPDATE users 
           SET provider = ?, provider_id = ?, avatar_url = ?, email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          ['facebook', profile.id, profile.photos[0].value, emailUser[0].id]
        );

        // Guardar tokens OAuth
        await pool.execute(
          `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
           VALUES (?, ?, ?, ?, ?)`,
          [emailUser[0].id, 'facebook', accessToken, refreshToken, new Date(Date.now() + 3600000)]
        );

        return done(null, emailUser[0]);
      }
    }

    // Crear nuevo usuario
    const [newUser] = await pool.execute(
      `INSERT INTO users (name, email, provider, provider_id, avatar_url, email_verified, email_verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.displayName, 
        email, 
        'facebook', 
        profile.id, 
        profile.photos[0].value,
        email ? true : false,
        email ? new Date() : null
      ]
    );

    // Crear configuración por defecto
    await pool.execute(
      'INSERT INTO user_settings (user_id) VALUES (?)',
      [newUser.insertId]
    );

    // Guardar tokens OAuth
    await pool.execute(
      `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [newUser.insertId, 'facebook', accessToken, refreshToken, new Date(Date.now() + 3600000)]
    );

    const [createdUser] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [newUser.insertId]
    );

    done(null, createdUser[0]);
  } catch (error) {
    done(error, null);
  }
  }));
}

// Estrategia de Apple OAuth - Solo se carga si hay credenciales válidas
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && 
    process.env.APPLE_CLIENT_ID !== 'placeholder_apple_client_id') {
  passport.use(new AppleStrategy({
  clientID: process.env.APPLE_CLIENT_ID,
  teamID: process.env.APPLE_TEAM_ID,
  keyID: process.env.APPLE_KEY_ID,
  privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
  callbackURL: '/api/auth/apple/callback',
  scope: ['name', 'email']
}, async (accessToken, refreshToken, idToken, profile, done) => {
  try {
    // Apple puede no proporcionar datos de perfil en solicitudes subsecuentes
    const appleId = profile.id;
    const email = profile.email;
    const name = profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : 'Usuario Apple';

    // Buscar usuario existente
    const [existingUser] = await pool.execute(
      'SELECT * FROM users WHERE provider = ? AND provider_id = ?',
      ['apple', appleId]
    );

    if (existingUser.length > 0) {
      // Usuario ya existe, actualizar tokens
      await pool.execute(
        `UPDATE oauth_tokens 
         SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND provider = ?`,
        [accessToken, refreshToken, new Date(Date.now() + 3600000), existingUser[0].id, 'apple']
      );
      return done(null, existingUser[0]);
    }

    // Buscar por email si existe
    if (email) {
      const [emailUser] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (emailUser.length > 0) {
        // Enlazar cuenta existente con Apple
        await pool.execute(
          `UPDATE users 
           SET provider = ?, provider_id = ?, email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          ['apple', appleId, emailUser[0].id]
        );

        // Guardar tokens OAuth
        await pool.execute(
          `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
           VALUES (?, ?, ?, ?, ?)`,
          [emailUser[0].id, 'apple', accessToken, refreshToken, new Date(Date.now() + 3600000)]
        );

        return done(null, emailUser[0]);
      }
    }

    // Crear nuevo usuario
    const [newUser] = await pool.execute(
      `INSERT INTO users (name, email, provider, provider_id, email_verified, email_verified_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, 'apple', appleId, email ? true : false, email ? new Date() : null]
    );

    // Crear configuración por defecto
    await pool.execute(
      'INSERT INTO user_settings (user_id) VALUES (?)',
      [newUser.insertId]
    );

    // Guardar tokens OAuth
    await pool.execute(
      `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [newUser.insertId, 'apple', accessToken, refreshToken, new Date(Date.now() + 3600000)]
    );

    const [createdUser] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [newUser.insertId]
    );

    done(null, createdUser[0]);
  } catch (error) {
    done(error, null);
  }
  }));
}

module.exports = passport;
