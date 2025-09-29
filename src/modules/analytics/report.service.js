import { Fair, Sale, SaleItem, Product } from '../../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../../config/database.config.js';
import { notFound } from '@hapi/boom';

// Obtener reporte diario de una feria
export const getFairDailyReport = async ({ userId, fairId }) => {
  // Verificar que la feria pertenece al usuario
  const fair = await Fair.findOne({
    where: {
      id: fairId,
      user_id: userId,
      is_active: true
    },
    attributes: ['id', 'name', 'start_date', 'end_date']
  });

  if (!fair) {
    throw notFound('Feria no encontrada');
  }

  // Obtener datos de ventas agrupados por día usando Sequelize
  const dailyData = await Sale.findAll({
    where: { fair_id: fairId },
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'sale_date'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('Sale.id'))), 'total_sales'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_method = 'cash' THEN 1 ELSE 0 END")), 'cash_sales'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END")), 'cash_revenue'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_method = 'transfer' THEN 1 ELSE 0 END")), 'transfer_sales'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END")), 'transfer_revenue'],
      [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_sale']
    ],
    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
    raw: true
  });

  // Para cada día, obtener los productos más vendidos y total de productos
  const dailyReports = await Promise.all(
    dailyData.map(async (day) => {
      const saleDate = day.sale_date;

      // Obtener total de productos vendidos en el día
      const productsCount = await SaleItem.findOne({
        attributes: [[sequelize.fn('SUM', sequelize.col('quantity')), 'total_products']],
        include: [{
          model: Sale,
          as: 'sale',
          where: {
            fair_id: fairId,
            created_at: {
              [Op.gte]: `${saleDate} 00:00:00`,
              [Op.lt]: `${saleDate} 23:59:59`
            }
          },
          attributes: []
        }],
        raw: true
      });

      // Obtener top 5 productos del día
      const topProducts = await SaleItem.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('quantity')), 'quantity_sold'],
          [sequelize.fn('SUM', sequelize.literal('quantity * unit_price')), 'revenue']
        ],
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name']
          },
          {
            model: Sale,
            as: 'sale',
            where: {
              fair_id: fairId,
              created_at: {
                [Op.gte]: `${saleDate} 00:00:00`,
                [Op.lt]: `${saleDate} 23:59:59`
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
        date: saleDate,
        total_sales: parseInt(day.total_sales),
        total_revenue: parseFloat(day.total_revenue || 0),
        cash_sales: parseInt(day.cash_sales),
        cash_revenue: parseFloat(day.cash_revenue || 0),
        transfer_sales: parseInt(day.transfer_sales),
        transfer_revenue: parseFloat(day.transfer_revenue || 0),
        products_sold: parseInt(productsCount?.total_products || 0),
        average_sale: parseFloat(day.average_sale || 0),
        top_products: topProducts.map(product => ({
          id: product['product.id'],
          name: product['product.name'],
          quantity_sold: parseInt(product.quantity_sold),
          revenue: parseFloat(product.revenue)
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
};

// Obtener reporte de una fecha específica
export const getDateReport = async ({ userId, fairId, date }) => {
  // Verificar que la feria pertenece al usuario
  const fair = await Fair.findOne({
    where: {
      id: fairId,
      user_id: userId,
      is_active: true
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
      created_at: {
        [Op.gte]: `${date} 00:00:00`,
        [Op.lt]: `${date} 23:59:59`
      }
    },
    attributes: [
      'id',
      'total_amount',
      'payment_method',
      'created_at',
      [sequelize.fn('COUNT', sequelize.col('sale_items.id')), 'items_count']
    ],
    include: [{
      model: SaleItem,
      as: 'sale_items',
      attributes: []
    }],
    group: ['Sale.id'],
    order: [['created_at', 'DESC']],
    raw: true
  });

  // Obtener productos vendidos en ese día
  const products = await SaleItem.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('quantity')), 'quantity_sold'],
      [sequelize.fn('SUM', sequelize.literal('quantity * unit_price')), 'revenue'],
      [sequelize.fn('AVG', sequelize.col('unit_price')), 'avg_price']
    ],
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name']
      },
      {
        model: Sale,
        as: 'sale',
        where: {
          fair_id: fairId,
          created_at: {
            [Op.gte]: `${date} 00:00:00`,
            [Op.lt]: `${date} 23:59:59`
          }
        },
        attributes: []
      }
    ],
    group: ['product.id', 'product.name'],
    order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
    raw: true
  });

  // Calcular estadísticas del día
  const stats = {
    total_sales: sales.length,
    total_revenue: sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
    cash_sales: sales.filter(sale => sale.payment_method === 'cash').length,
    cash_revenue: sales
      .filter(sale => sale.payment_method === 'cash')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
    transfer_sales: sales.filter(sale => sale.payment_method === 'transfer').length,
    transfer_revenue: sales
      .filter(sale => sale.payment_method === 'transfer')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
    products_sold: products.reduce((sum, product) => sum + parseInt(product.quantity_sold), 0),
    average_sale: sales.length > 0
      ? sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) / sales.length
      : 0
  };

  return {
    date,
    fair_name: fair.name,
    stats,
    sales: sales.map(sale => ({
      id: sale.id,
      total_amount: parseFloat(sale.total_amount),
      payment_method: sale.payment_method,
      created_at: sale.created_at,
      items_count: parseInt(sale.items_count)
    })),
    products: products.map(product => ({
      id: product['product.id'],
      name: product['product.name'],
      quantity_sold: parseInt(product.quantity_sold),
      revenue: parseFloat(product.revenue),
      avg_price: parseFloat(product.avg_price)
    }))
  };
};
