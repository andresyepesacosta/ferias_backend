import express from 'express';
import * as eventController from './event.controller.js';
import { authenticateSession } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Gestión de eventos
 */

router.use(authenticateSession);

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Obtener todos los eventos
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', eventController.getEvents);

/**
 * @swagger
 * /api/v1/events/stats:
 *   get:
 *     summary: Obtener estadísticas de eventos
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', eventController.getEventStats);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Obtener evento por ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', eventController.getEventById);

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Crear nuevo evento
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', eventController.createEvent);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   put:
 *     summary: Actualizar evento
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', eventController.updateEvent);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   delete:
 *     summary: Eliminar evento
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', eventController.deleteEvent);

export default router;