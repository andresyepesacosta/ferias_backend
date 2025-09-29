import { notFound, badRequest, internal } from "@hapi/boom";
import { User, Sale, SaleItem, Product } from '../../models/index.js';
import Fair from './fair.model.js';
import { Op } from 'sequelize';
import sequelize from '../../config/database.config.js';

export const getFairs = async ({ userId }) => {
  try {
    // Primero actualizamos automáticamente los estados basados en fechas
    await Fair.update(
      {
        status: sequelize.literal(`
          CASE 
            WHEN start_date > CURDATE() THEN 'upcoming'
            WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 'active'
            WHEN end_date < CURDATE() AND status != 'cancelled' THEN 'completed'
            ELSE status
          END
        `)
      },
      {
        where: {
          user_id: userId,
          status: {
            [Op.ne]: 'cancelled'
          }
        }
      }
    );

    // Obtener todas las ferias del usuario con información calculada
    const fairs = await Fair.findAll({
      where: {
        user_id: userId
      },
      attributes: [
        'id',
        'name',
        'location',
        'start_date',
        'end_date',
        'description',
        'status',
        'initial_cash_amount',
        'expenses',
        'created_at',
        'updated_at',
        [sequelize.literal('DATEDIFF(start_date, CURDATE())'), 'days_until_start'],
        [sequelize.literal('DATEDIFF(end_date, CURDATE())'), 'days_until_end']
      ],
      order: [['start_date', 'DESC']]
    });

    return { fairs };
  } catch (error) {
    console.error('Error in getFairs service:', error);
    throw internal('Error al obtener las ferias del usuario');
  }
}

export const getFairById = async ({ userId, fairId }) => {
  try {
    // Actualizar el estado de la feria basado en fechas
    await Fair.update(
      {
        status: sequelize.literal(`
          CASE 
            WHEN start_date > CURDATE() THEN 'upcoming'
            WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 'active'
            WHEN end_date < CURDATE() AND status != 'cancelled' THEN 'completed'
            ELSE status
          END
        `)
      },
      {
        where: {
          id: fairId,
          user_id: userId,
          status: {
            [Op.ne]: 'cancelled'
          }
        }
      }
    );

    // Obtener la feria específica
    const fair = await Fair.findOne({
      where: {
        id: fairId,
        user_id: userId
      },
      attributes: [
        'id',
        'name',
        'location',
        'start_date',
        'end_date',
        'description',
        'status',
        'initial_cash_amount',
        'expenses',
        'created_at',
        'updated_at',
        [sequelize.literal('DATEDIFF(start_date, CURDATE())'), 'days_until_start'],
        [sequelize.literal('DATEDIFF(end_date, CURDATE())'), 'days_until_end']
      ]
    });

    if (!fair) {
      throw notFound('Feria no encontrada');
    }

    return { fair };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error in getFairById service:', error);
    throw internal('Error al obtener la feria');
  }
}

export const createFair = async ({ userId, fairData }) => {
  const { name, location, start_date, end_date, description, entry_fee, notes, initial_cash_amount, expenses } = fairData;

  // Crear la feria (las validaciones ya se manejan en el schema)
  const newFair = await Fair.create({
    user_id: userId,
    name,
    location,
    start_date,
    end_date,
    description: description || null,
    entry_fee: entry_fee || null,
    notes: notes || null,
    initial_cash_amount: initial_cash_amount || 0,
    expenses: expenses || 0
  });

  return { fair: newFair };
}

export const updateFair = async ({ userId, fairId, updateData }) => {
  const { name, location, start_date, end_date, description, status, initial_cash_amount, expenses } = updateData;

  // Verificar que la feria existe y pertenece al usuario
  const existingFair = await Fair.findOne({
    where: {
      id: fairId,
      user_id: userId
    }
  });

  if (!existingFair) {
    throw notFound('Feria no encontrada');
  }

  // Construir objeto de actualización dinámicamente
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (location !== undefined) updates.location = location;
  if (start_date !== undefined) updates.start_date = start_date;
  if (end_date !== undefined) updates.end_date = end_date;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (initial_cash_amount !== undefined) updates.initial_cash_amount = initial_cash_amount;
  if (expenses !== undefined) updates.expenses = expenses;

  if (Object.keys(updates).length === 0) {
    throw badRequest('No se proporcionaron campos para actualizar');
  }

  // Actualizar la feria
  await Fair.update(updates, {
    where: {
      id: fairId,
      user_id: userId
    }
  });

  // Obtener la feria actualizada
  const updatedFair = await Fair.findOne({
    where: {
      id: fairId,
      user_id: userId
    }
  });

  return { fair: updatedFair };
}

export const deleteFair = async ({ userId, fairId }) => {
  // Verificar que la feria existe y pertenece al usuario
  const existingFair = await Fair.findOne({
    where: {
      id: fairId,
      user_id: userId
    }
  });

  if (!existingFair) {
    throw notFound('Feria no encontrada');
  }

  // Eliminar la feria
  await Fair.destroy({
    where: {
      id: fairId,
      user_id: userId
    }
  });

  return { message: 'Feria eliminada exitosamente' };
}

export const getFairStats = async ({ userId }) => {
  try {
    const stats = await Fair.findOne({
      where: {
        user_id: userId
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_fairs'],
        [sequelize.literal("SUM(CASE WHEN start_date > CURDATE() THEN 1 ELSE 0 END)"), 'upcoming_fairs'],
        [sequelize.literal("SUM(CASE WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 1 ELSE 0 END)"), 'active_fairs'],
        [sequelize.literal("SUM(CASE WHEN end_date < CURDATE() THEN 1 ELSE 0 END)"), 'completed_fairs'],
        [sequelize.literal("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)"), 'cancelled_fairs'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('entry_fee')), 0), 'total_entry_fees']
      ],
      raw: true
    });

    return { stats };
  } catch (error) {
    console.error('Error in getFairStats service:', error);
    throw internal('Error al obtener estadísticas de ferias');
  }
}

export const updateFairExpenses = async ({ userId, fairId, expenses }) => {
  // Verificar que la feria existe y pertenece al usuario
  const existingFair = await Fair.findOne({
    where: {
      id: fairId,
      user_id: userId
    }
  });

  if (!existingFair) {
    throw notFound('Feria no encontrada');
  }

  // Actualizar solo el campo expenses (validación ya manejada por schema)
  await Fair.update(
    { expenses: parseFloat(expenses) },
    {
      where: {
        id: fairId,
        user_id: userId
      }
    }
  );

  // Obtener la feria actualizada
  const updatedFair = await Fair.findOne({
    where: {
      id: fairId,
      user_id: userId
    }
  });

  return { fair: updatedFair };
}

export const getFairDailyReport = async ({ userId, fairId }) => {
  try {
    // Verificar que la feria pertenece al usuario
    const fair = await Fair.findOne({
      where: {
        id: fairId,
        user_id: userId
      },
      attributes: ['id', 'name', 'start_date', 'end_date']
    });

    if (!fair) {
      throw notFound('Feria no encontrada');
    }

    // Obtener datos de ventas agrupados por día usando Sequelize
    const dailyData = await Sale.findAll({
      where: {
        fair_id: fairId
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('sale_date')), 'sale_date'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('Sale.id'))), 'total_sales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
        [
          sequelize.literal("SUM(CASE WHEN payment_method = 'cash' THEN 1 ELSE 0 END)"),
          'cash_sales'
        ],
        [
          sequelize.literal("SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END)"),
          'cash_revenue'
        ],
        [
          sequelize.literal("SUM(CASE WHEN payment_method = 'transfer' THEN 1 ELSE 0 END)"),
          'transfer_sales'
        ],
        [
          sequelize.literal("SUM(CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END)"),
          'transfer_revenue'
        ],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_sale']
      ],
      group: [sequelize.fn('DATE', sequelize.col('sale_date'))],
      order: [[sequelize.fn('DATE', sequelize.col('sale_date')), 'DESC']],
      raw: true
    });

    // Para cada día, obtener los productos más vendidos y total de productos
    const dailyReports = await Promise.all(
      dailyData.map(async (day) => {
        // Obtener total de productos vendidos en el día
        const productsCount = await SaleItem.sum('quantity', {
          include: [{
            model: Sale,
            as: 'sale',
            where: {
              fair_id: fairId,
              sale_date: {
                [Op.and]: [
                  sequelize.where(sequelize.fn('DATE', sequelize.col('sale.sale_date')), day.sale_date)
                ]
              }
            },
            attributes: []
          }]
        });

        // Obtener top productos del día
        const topProducts = await SaleItem.findAll({
          attributes: [
            [sequelize.col('product.id'), 'id'],
            [sequelize.col('product.name'), 'name'],
            [sequelize.fn('SUM', sequelize.col('quantity')), 'quantity_sold'],
            [sequelize.literal('SUM(quantity * unit_price)'), 'revenue']
          ],
          include: [
            {
              model: Product,
              as: 'product',
              attributes: []
            },
            {
              model: Sale,
              as: 'sale',
              where: {
                fair_id: fairId,
                sale_date: {
                  [Op.and]: [
                    sequelize.where(sequelize.fn('DATE', sequelize.col('sale.sale_date')), day.sale_date)
                  ]
                }
              },
              attributes: []
            }
          ],
          group: ['product.id', 'product.name'],
          order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
          limit: 5,
          raw: true
        });

        return {
          date: day.sale_date,
          total_sales: parseInt(day.total_sales || 0),
          total_revenue: parseFloat(day.total_revenue || 0),
          cash_sales: parseInt(day.cash_sales || 0),
          cash_revenue: parseFloat(day.cash_revenue || 0),
          transfer_sales: parseInt(day.transfer_sales || 0),
          transfer_revenue: parseFloat(day.transfer_revenue || 0),
          products_sold: parseInt(productsCount || 0),
          average_sale: parseFloat(day.average_sale || 0),
          top_products: topProducts.map(product => ({
            id: product.id,
            name: product.name,
            quantity_sold: parseInt(product.quantity_sold || 0),
            revenue: parseFloat(product.revenue || 0)
          }))
        };
      })
    );

    // Calcular resumen
    const summary = {
      total_days: dailyReports.length,
      total_sales: dailyReports.reduce((sum, day) => sum + day.total_sales, 0),
      total_revenue: dailyReports.reduce((sum, day) => sum + day.total_revenue, 0),
      average_daily_revenue: dailyReports.length > 0
        ? dailyReports.reduce((sum, day) => sum + day.total_revenue, 0) / dailyReports.length
        : 0,
      best_day: dailyReports.length > 0
        ? dailyReports.reduce((best, day) => day.total_revenue > best.total_revenue ? day : best)
        : null,
      worst_day: dailyReports.length > 0
        ? dailyReports.reduce((worst, day) => day.total_revenue < worst.total_revenue ? day : worst)
        : null
    };

    // Formatear best_day y worst_day
    if (summary.best_day) {
      summary.best_day = {
        date: summary.best_day.date,
        revenue: summary.best_day.total_revenue
      };
    }

    if (summary.worst_day) {
      summary.worst_day = {
        date: summary.worst_day.date,
        revenue: summary.worst_day.total_revenue
      };
    }

    return {
      fair_id: parseInt(fairId),
      fair_name: fair.name,
      start_date: fair.start_date,
      end_date: fair.end_date,
      daily_reports: dailyReports,
      summary
    };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error in getFairDailyReport service:', error);
    throw internal('Error al obtener el reporte diario de la feria');
  }
}

export const getFairDateReport = async ({ userId, fairId, date }) => {
  try {
    // Verificar que la feria pertenece al usuario
    const fair = await Fair.findOne({
      where: {
        id: fairId,
        user_id: userId
      },
      attributes: ['id', 'name']
    });

    if (!fair) {
      throw notFound('Feria no encontrada');
    }

    // Obtener todas las ventas del día específico
    const sales = await Sale.findAll({
      where: {
        fair_id: fairId,
        sale_date: {
          [Op.and]: [
            sequelize.where(sequelize.fn('DATE', sequelize.col('sale_date')), date)
          ]
        }
      },
      attributes: [
        'id',
        'total_amount',
        'payment_method',
        'created_at',
        [
          sequelize.literal('(SELECT COUNT(*) FROM sale_items WHERE sale_items.sale_id = Sale.id)'),
          'items_count'
        ]
      ],
      order: [['created_at', 'DESC']],
      raw: true
    });

    // Obtener productos vendidos en ese día
    const products = await SaleItem.findAll({
      attributes: [
        [sequelize.col('product.id'), 'id'],
        [sequelize.col('product.name'), 'name'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'quantity_sold'],
        [sequelize.literal('SUM(quantity * unit_price)'), 'revenue'],
        [sequelize.fn('AVG', sequelize.col('unit_price')), 'avg_price']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: []
        },
        {
          model: Sale,
          as: 'sale',
          where: {
            fair_id: fairId,
            sale_date: {
              [Op.and]: [
                sequelize.where(sequelize.fn('DATE', sequelize.col('sale.sale_date')), date)
              ]
            }
          },
          attributes: []
        }
      ],
      group: ['product.id', 'product.name'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      raw: true
    });

    // Estadísticas del día
    const stats = {
      total_sales: sales.length,
      total_revenue: sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
      cash_sales: sales.filter(sale => sale.payment_method === 'cash').length,
      cash_revenue: sales
        .filter(sale => sale.payment_method === 'cash')
        .reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
      transfer_sales: sales.filter(sale => sale.payment_method === 'transfer').length,
      transfer_revenue: sales
        .filter(sale => sale.payment_method === 'transfer')
        .reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
      products_sold: products.reduce((sum, product) => sum + parseInt(product.quantity_sold || 0), 0),
      average_sale: sales.length > 0
        ? sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) / sales.length
        : 0
    };

    return {
      date,
      fair_name: fair.name,
      stats,
      sales: sales.map(sale => ({
        id: sale.id,
        total_amount: parseFloat(sale.total_amount || 0),
        payment_method: sale.payment_method,
        created_at: sale.created_at,
        items_count: parseInt(sale.items_count || 0)
      })),
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        quantity_sold: parseInt(product.quantity_sold || 0),
        revenue: parseFloat(product.revenue || 0),
        avg_price: parseFloat(product.avg_price || 0)
      }))
    };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error in getFairDateReport service:', error);
    throw internal('Error al obtener el reporte de fecha específica');
  }
}