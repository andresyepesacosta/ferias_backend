import { Router } from 'express';
import passport from '../../config/authentication.config.js';
import { validateSchema } from '../../middleware/validation.middleware.js';
import * as authController from './auth.controller.js';
import { authLoginSchema, authRegisterSchema } from './auth.schemas.js';
import { authenticateSession } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de usuarios
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 */
router.post('/login', validateSchema(authLoginSchema), authController.login);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 */
router.post('/register', validateSchema(authRegisterSchema), authController.register);

//router.get('/verify', authenticateSession, authController.verifyToken);

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Login con Google OAuth
 *     tags: [Auth]
 */
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Callback de Google OAuth
 *     tags: [Auth]
 */
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  authController.handleOAuthCallback
);

/**
 * @swagger
 * /api/v1/auth/facebook:
 *   get:
 *     summary: Login con Facebook OAuth
 *     tags: [Auth]
 */
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

/**
 * @swagger
 * /api/v1/auth/facebook/callback:
 *   get:
 *     summary: Callback de Facebook OAuth
 *     tags: [Auth]
 */
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login?error=facebook_auth_failed' }),
  authController.handleOAuthCallback
);

/**
 * @swagger
 * /api/v1/auth/apple:
 *   get:
 *     summary: Login con Apple OAuth
 *     tags: [Auth]
 */
router.get('/apple',
  passport.authenticate('apple')
);

/**
 * @swagger
 * /api/v1/auth/apple/callback:
 *   post:
 *     summary: Callback de Apple OAuth
 *     tags: [Auth]
 */
router.post('/apple/callback',
  passport.authenticate('apple', { failureRedirect: '/login?error=apple_auth_failed' }),
  authController.handleOAuthCallback
);

/**
 * @swagger
 * /api/v1/auth/disconnect/{provider}:
 *   post:
 *     summary: Desconectar proveedor OAuth
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/disconnect/:provider', authenticateSession, authController.disconnectOAuthProvider);

export default router;