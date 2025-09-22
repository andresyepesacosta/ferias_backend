import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import * as eventController from './event.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/events - Obtener todos los eventos del usuario
router.get('/', eventController.getEvents);

// GET /api/events/stats - Obtener estadísticas de eventos del usuario
router.get('/stats', eventController.getEventStats);

// GET /api/events/:id - Obtener un evento específico
router.get('/:id', eventController.getEventById);

// POST /api/events - Crear un nuevo evento
router.post('/', eventController.createEvent);

// PUT /api/events/:id - Actualizar un evento existente
router.put('/:id', eventController.updateEvent);

// DELETE /api/events/:id - Eliminar un evento
router.delete('/:id', eventController.deleteEvent);

export default router;