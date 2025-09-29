import { User, Sale } from '../../models/index.js';
import Event from './event.model.js';
import { Op } from 'sequelize';
import sequelize from '../../config/database.config.js';

export const getEvents = async ({ userId }) => {
  try {
    const events = await Event.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      attributes: [
        'id',
        'name',
        'description',
        'location',
        'start_date',
        'end_date',
        'entry_fee',
        'estimated_sales',
        'notes',
        'is_active',
        'created_at',
        'updated_at',
        [sequelize.literal('DATEDIFF(start_date, CURDATE())'), 'days_until_start'],
        [sequelize.literal('DATEDIFF(end_date, CURDATE())'), 'days_until_end'],
        [sequelize.literal('DATEDIFF(end_date, start_date) + 1'), 'duration_days'],
        // Contar ventas asociadas al evento
        [
          sequelize.literal('(SELECT COUNT(*) FROM sales WHERE sales.event_id = Event.id)'),
          'sales_count'
        ],
        // Calcular total de ventas del evento
        [
          sequelize.literal('(SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE sales.event_id = Event.id)'),
          'total_sales_amount'
        ]
      ],
      order: [['start_date', 'DESC']]
    });

    return { events };
  } catch (error) {
    console.error('Error in getEvents service:', error);
    throw new Error('Error al obtener los eventos del usuario');
  }
};

export const getEventById = async ({ userId, eventId }) => {
  try {
    const event = await Event.findOne({
      where: {
        id: eventId,
        user_id: userId
      },
      attributes: [
        'id',
        'name',
        'description',
        'location',
        'start_date',
        'end_date',
        'entry_fee',
        'estimated_sales',
        'notes',
        'is_active',
        'created_at',
        'updated_at',
        [sequelize.literal('DATEDIFF(start_date, CURDATE())'), 'days_until_start'],
        [sequelize.literal('DATEDIFF(end_date, CURDATE())'), 'days_until_end'],
        [sequelize.literal('DATEDIFF(end_date, start_date) + 1'), 'duration_days'],
        [
          sequelize.literal('(SELECT COUNT(*) FROM sales WHERE sales.event_id = Event.id)'),
          'sales_count'
        ],
        [
          sequelize.literal('(SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE sales.event_id = Event.id)'),
          'total_sales_amount'
        ]
      ],
      include: [
        {
          model: Sale,
          as: 'sales',
          attributes: ['id', 'total_amount', 'payment_method', 'status', 'sale_date'],
          limit: 10,
          order: [['sale_date', 'DESC']],
          required: false
        }
      ]
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    return { event };
  } catch (error) {
    console.error('Error in getEventById service:', error);
    throw error;
  }
};

export const createEvent = async ({ userId, eventData }) => {
  try {
    const {
      name,
      description,
      location,
      start_date,
      end_date,
      entry_fee,
      estimated_sales,
      notes
    } = eventData;

    // Validaciones básicas
    if (!name || name.trim().length === 0) {
      throw new Error('El nombre del evento es requerido');
    }

    if (!location || location.trim().length === 0) {
      throw new Error('La ubicación del evento es requerida');
    }

    if (!start_date || !end_date) {
      throw new Error('Las fechas de inicio y fin son requeridas');
    }

    // Validar que la fecha de fin no sea anterior a la de inicio
    if (new Date(end_date) < new Date(start_date)) {
      throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
    }

    // Validar que las fechas no sean en el pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(start_date);
    startDate.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new Error('La fecha de inicio no puede ser en el pasado');
    }

    // Validar montos si se proporcionan
    if (entry_fee && (isNaN(parseFloat(entry_fee)) || parseFloat(entry_fee) < 0)) {
      throw new Error('La tarifa de entrada debe ser un número válido mayor o igual a 0');
    }

    if (estimated_sales && (isNaN(parseFloat(estimated_sales)) || parseFloat(estimated_sales) < 0)) {
      throw new Error('Las ventas estimadas deben ser un número válido mayor o igual a 0');
    }

    // Crear el evento
    const newEvent = await Event.create({
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
      location: location.trim(),
      start_date,
      end_date,
      entry_fee: parseFloat(entry_fee || 0),
      estimated_sales: parseFloat(estimated_sales || 0),
      notes: notes?.trim() || null
    });

    return { event: newEvent };
  } catch (error) {
    console.error('Error in createEvent service:', error);
    throw error;
  }
};

export const updateEvent = async ({ userId, eventId, updateData }) => {
  try {
    // Verificar que el evento existe y pertenece al usuario
    const existingEvent = await Event.findOne({
      where: {
        id: eventId,
        user_id: userId
      }
    });

    if (!existingEvent) {
      throw new Error('Evento no encontrado');
    }

    const {
      name,
      description,
      location,
      start_date,
      end_date,
      entry_fee,
      estimated_sales,
      notes,
      is_active
    } = updateData;

    // Validaciones si se actualiza el nombre
    if (name !== undefined && (!name || name.trim().length === 0)) {
      throw new Error('El nombre del evento es requerido');
    }

    // Validaciones si se actualiza la ubicación
    if (location !== undefined && (!location || location.trim().length === 0)) {
      throw new Error('La ubicación del evento es requerida');
    }

    // Validaciones si se proporcionan nuevas fechas
    if (start_date && end_date) {
      if (new Date(end_date) < new Date(start_date)) {
        throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
      }
    }

    // Validar montos si se actualizan
    if (entry_fee !== undefined && (isNaN(parseFloat(entry_fee)) || parseFloat(entry_fee) < 0)) {
      throw new Error('La tarifa de entrada debe ser un número válido mayor o igual a 0');
    }

    if (estimated_sales !== undefined && (isNaN(parseFloat(estimated_sales)) || parseFloat(estimated_sales) < 0)) {
      throw new Error('Las ventas estimadas deben ser un número válido mayor o igual a 0');
    }

    // Construir objeto de actualización
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (location !== undefined) updates.location = location.trim();
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (entry_fee !== undefined) updates.entry_fee = parseFloat(entry_fee);
    if (estimated_sales !== undefined) updates.estimated_sales = parseFloat(estimated_sales);
    if (notes !== undefined) updates.notes = notes?.trim() || null;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      throw new Error('No se proporcionaron campos para actualizar');
    }

    // Actualizar el evento
    await existingEvent.update(updates);

    // Obtener el evento actualizado con estadísticas
    const updatedEvent = await Event.findOne({
      where: { id: eventId },
      attributes: [
        'id',
        'name',
        'description',
        'location',
        'start_date',
        'end_date',
        'entry_fee',
        'estimated_sales',
        'notes',
        'is_active',
        'created_at',
        'updated_at',
        [sequelize.literal('DATEDIFF(start_date, CURDATE())'), 'days_until_start'],
        [sequelize.literal('DATEDIFF(end_date, CURDATE())'), 'days_until_end'],
        [sequelize.literal('DATEDIFF(end_date, start_date) + 1'), 'duration_days']
      ]
    });

    return { event: updatedEvent };
  } catch (error) {
    console.error('Error in updateEvent service:', error);
    throw error;
  }
};

export const deleteEvent = async ({ userId, eventId }) => {
  try {
    // Verificar que el evento existe y pertenece al usuario
    const existingEvent = await Event.findOne({
      where: {
        id: eventId,
        user_id: userId
      }
    });

    if (!existingEvent) {
      throw new Error('Evento no encontrado');
    }

    // Verificar si hay ventas asociadas a este evento
    const salesCount = await Sale.count({
      where: {
        event_id: eventId
      }
    });

    if (salesCount > 0) {
      throw new Error(`No se puede eliminar el evento porque tiene ${salesCount} venta(s) asociada(s). Primero elimine las ventas relacionadas.`);
    }

    // Soft delete - marcar como inactivo
    await existingEvent.update({ is_active: false });

    return { message: 'Evento eliminado exitosamente' };
  } catch (error) {
    console.error('Error in deleteEvent service:', error);
    throw error;
  }
};

export const getEventStats = async ({ userId }) => {
  try {
    const stats = await Event.findOne({
      where: {
        user_id: userId
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_events'],
        [sequelize.literal("SUM(CASE WHEN start_date > CURDATE() THEN 1 ELSE 0 END)"), 'upcoming_events'],
        [sequelize.literal("SUM(CASE WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 1 ELSE 0 END)"), 'active_events'],
        [sequelize.literal("SUM(CASE WHEN end_date < CURDATE() THEN 1 ELSE 0 END)"), 'completed_events'],
        [sequelize.literal("SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END)"), 'inactive_events'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('entry_fee')), 0), 'total_entry_fees'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('estimated_sales')), 0), 'total_estimated_sales'],
        [sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('entry_fee')), 0), 'average_entry_fee']
      ],
      raw: true
    });

    return { stats };
  } catch (error) {
    console.error('Error in getEventStats service:', error);
    throw new Error('Error al obtener estadísticas de eventos');
  }
};
