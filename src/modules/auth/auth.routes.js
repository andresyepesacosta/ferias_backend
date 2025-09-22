import { Router } from 'express';
import passport from '../../config/passport.js';
import { authenticateToken } from '../../middleware/auth.js';
import * as authController from './auth.controller.js';

const router = Router();

// ============= RUTAS PÚBLICAS (LOCAL) =============
router.post('/login', authController.login);
router.post('/register', authController.register);

// ============= RUTAS PROTEGIDAS =============
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.get('/user/currency', authenticateToken, authController.getUserCurrency);
router.put('/user/currency', authenticateToken, authController.updateUserCurrency);

// ============= RUTAS OAUTH =============

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  authController.handleOAuthCallback
);

// Facebook OAuth
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login?error=facebook_auth_failed' }),
  authController.handleOAuthCallback
);

// Apple OAuth
router.get('/apple',
  passport.authenticate('apple')
);

router.post('/apple/callback',
  passport.authenticate('apple', { failureRedirect: '/login?error=apple_auth_failed' }),
  authController.handleOAuthCallback
);

// Rutas OAuth protegidas
router.get('/me', authenticateToken, authController.getOAuthUserProfile);
router.post('/disconnect/:provider', authenticateToken, authController.disconnectOAuthProvider);

export default router;