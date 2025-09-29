import * as eventService from './event.service.js';

export const getEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { events } = await eventService.getEvents({ userId });

    res.status(200).json({
      success: true,
      data: {
        events
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const { event } = await eventService.getEventById({ userId, eventId });

    res.status(200).json({
      success: true,
      data: {
        event
      }
    });

  } catch (error) {
    if (error.message === 'Evento no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventData = req.body;

    const { event } = await eventService.createEvent({ userId, eventData });

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: {
        event
      }
    });

  } catch (error) {
    if (error.message.includes('requerido') ||
      error.message.includes('anterior') ||
      error.message.includes('pasado') ||
      error.message.includes('número válido')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;
    const updateData = req.body;

    const { event } = await eventService.updateEvent({ userId, eventId, updateData });

    res.status(200).json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: {
        event
      }
    });

  } catch (error) {
    if (error.message === 'Evento no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('requerido') ||
      error.message.includes('anterior') ||
      error.message.includes('número válido') ||
      error.message.includes('campos para actualizar')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const { message } = await eventService.deleteEvent({ userId, eventId });

    res.status(200).json({
      success: true,
      message
    });

  } catch (error) {
    if (error.message === 'Evento no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('venta(s) asociada(s)')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const getEventStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { stats } = await eventService.getEventStats({ userId });

    res.status(200).json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    next(error);
  }
};
