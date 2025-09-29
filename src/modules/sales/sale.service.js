import { Product, Fair, User } from '../../models/index.js';
import Sale from './sale.model.js';
import SaleItem from './saleItem.model.js';
import { Op } from 'sequelize';
import sequelize from '../../config/database.config.js';
import { notFound, badRequest } from '@hapi/boom';

// Obtener todas las ventas de una feria
export const getSalesByFair = async ({ userId, fairId }) => {
  const sales = await Sale.findAll({
    where: {
      fair_id: fairId,
      user_id: userId
    },
    include: [
      {
        model: Fair,
        as: 'fair',
        attributes: ['name']
      },
      {
        model: SaleItem,
        as: 'sale_items',
        attributes: []
      }
    ],
    attributes: [
      'id', 'total_amount', 'payment_method', 'notes', 'created_at',
      [sequelize.fn('COUNT', sequelize.col('sale_items.id')), 'items_count']
    ],
    group: ['Sale.id', 'fair.id'],
    order: [['created_at', 'DESC']]
  });

  return { sales };
};

// Obtener detalles de una venta específica
export const getSaleDetails = async ({ userId, saleId }) => {
  // Obtener información de la venta
  const sale = await Sale.findOne({
    where: {
      id: saleId,
      user_id: userId
    },
    include: [
      {
        model: Fair,
        as: 'fair',
        attributes: ['name']
      }
    ]
  });

  if (!sale) {
    throw notFound('Venta no encontrada');
  }

  // Obtener items de la venta
  const items = await SaleItem.findAll({
    where: { sale_id: saleId },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['name', 'barcode', 'price']
      }
    ],
    order: [['id', 'ASC']]
  });

  return {
    sale: {
      ...sale.toJSON(),
      fair_name: sale.fair?.name
    },
    items: items.map(item => ({
      ...item.toJSON(),
      product_name: item.product?.name,
      barcode: item.product?.barcode,
      original_price: item.product?.price
    }))
  };
};

// Crear una nueva venta
export const createSale = async ({ userId, saleData }) => {
  const transaction = await sequelize.transaction();

  try {
    const { fairId, items, paymentMethod, notes, customerInfo, tax, shippingCost } = saleData;

    // Validar que la feria pertenezca al usuario
    const fair = await Fair.findOne({
      where: {
        id: fairId,
        user_id: userId,
        status: 'active'
      }
    }, { transaction });

    if (!fair) {
      await transaction.rollback();
      throw notFound('Feria no encontrada');
    }

    // Validar y calcular el total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      // Verificar que el producto existe y pertenece al usuario
      const product = await Product.findOne({
        where: {
          id: item.productId,
          user_id: userId,
          is_active: true
        }
      }, { transaction });

      if (!product) {
        await transaction.rollback();
        throw badRequest(`Producto con ID ${item.productId} no encontrado`);
      }

      // Verificar stock si el producto lo maneja
      if (product.manage_stock && product.stock < item.quantity) {
        await transaction.rollback();
        throw badRequest(`Stock insuficiente para el producto ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
      }

      const discount = item.discount || 0;
      const subtotal = item.quantity * item.unitPrice * (1 - discount / 100);
      totalAmount += subtotal;

      validatedItems.push({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: discount,
        subtotal: subtotal
      });

      // Actualizar stock si el producto lo maneja
      if (product.manage_stock) {
        await product.update({
          stock: product.stock - item.quantity
        }, { transaction });
      }
    }

    // Aplicar impuestos y costos de envío
    const taxAmount = totalAmount * ((tax || 0) / 100);
    const finalAmount = totalAmount + taxAmount + (shippingCost || 0);

    // Crear la venta
    const sale = await Sale.create({
      fair_id: fairId,
      user_id: userId,
      total_amount: finalAmount,
      subtotal: totalAmount,
      tax_amount: taxAmount,
      shipping_cost: shippingCost || 0,
      payment_method: paymentMethod,
      notes: notes || null,
      customer_name: customerInfo?.name || null,
      customer_phone: customerInfo?.phone || null,
      customer_email: customerInfo?.email || null,
      customer_address: customerInfo?.address || null
    }, { transaction });

    // Crear los items de la venta
    const saleItemsData = validatedItems.map(item => ({
      ...item,
      sale_id: sale.id
    }));

    await SaleItem.bulkCreate(saleItemsData, { transaction });

    await transaction.commit();

    // Obtener la venta completa con detalles
    const { sale: completeSale } = await getSaleDetails({ userId, saleId: sale.id });

    return {
      sale: completeSale,
      message: 'Venta creada exitosamente'
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Buscar productos por nombre o código de barras
export const searchProducts = async ({ userId, search, fairId, category, limit = 20 }) => {
  if (!search || search.length < 2) {
    return { products: [] };
  }

  const whereClause = {
    user_id: userId,
    is_active: true,
    [Op.or]: [
      { name: { [Op.iLike]: `%${search}%` } },
      { barcode: { [Op.like]: `%${search}%` } }
    ]
  };

  // Filtrar por categoría si se proporciona
  if (category) {
    whereClause.category_id = category;
  }

  const products = await Product.findAll({
    where: whereClause,
    attributes: [
      'id', 'name', 'barcode', 'price', 'stock', 'manage_stock',
      'description', 'category_id'
    ],
    limit: parseInt(limit),
    order: [
      [sequelize.literal(`CASE WHEN name ILIKE '${search}%' THEN 1 ELSE 2 END`), 'ASC'],
      ['name', 'ASC']
    ]
  });

  return {
    products: products.map(product => ({
      ...product.toJSON(),
      stock_available: product.manage_stock ? product.stock : null,
      has_stock: !product.manage_stock || product.stock > 0
    }))
  };
};

// Obtener estadísticas de ventas de una feria
export const getFairSalesStats = async ({ userId, fairId }) => {
  // Verificar que la feria pertenece al usuario
  const fair = await Fair.findOne({
    where: {
      id: fairId,
      user_id: userId,
      status: 'active'
    },
    attributes: ['id', 'name', 'start_date', 'end_date']
  });

  if (!fair) {
    throw notFound('Feria no encontrada');
  }

  // Obtener estadísticas generales
  const stats = await Sale.findOne({
    where: { fair_id: fairId },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_sales'],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_amount')), 0), 'total_revenue'],
      [sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('total_amount')), 0), 'average_sale'],
      [sequelize.fn('COUNT', sequelize.literal("CASE WHEN payment_method = 'cash' THEN 1 END")), 'cash_sales'],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END")), 0), 'cash_revenue'],
      [sequelize.fn('COUNT', sequelize.literal("CASE WHEN payment_method = 'transfer' THEN 1 END")), 'transfer_sales'],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END")), 0), 'transfer_revenue']
    ],
    raw: true
  });

  // Obtener productos más vendidos
  const topProducts = await SaleItem.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('quantity')), 'total_sold'],
      [sequelize.fn('SUM', sequelize.literal('quantity * unit_price')), 'total_revenue']
    ],
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price']
      },
      {
        model: Sale,
        as: 'sale',
        where: { fair_id: fairId },
        attributes: []
      }
    ],
    group: ['product.id', 'product.name', 'product.price'],
    order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
    limit: 10,
    raw: true
  });

  // Ventas por día (últimos 30 días o desde el inicio de la feria)
  const dailySales = await Sale.findAll({
    where: { fair_id: fairId },
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'sales_count'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'daily_revenue']
    ],
    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
    limit: 30,
    raw: true
  });

  return {
    fair: {
      id: fair.id,
      name: fair.name,
      start_date: fair.start_date,
      end_date: fair.end_date
    },
    summary: {
      total_sales: parseInt(stats.total_sales),
      total_revenue: parseFloat(stats.total_revenue),
      average_sale: parseFloat(stats.average_sale),
      cash_sales: parseInt(stats.cash_sales),
      cash_revenue: parseFloat(stats.cash_revenue),
      transfer_sales: parseInt(stats.transfer_sales),
      transfer_revenue: parseFloat(stats.transfer_revenue)
    },
    top_products: topProducts.map(item => ({
      product_id: item['product.id'],
      name: item['product.name'],
      price: parseFloat(item['product.price']),
      total_sold: parseInt(item.total_sold),
      total_revenue: parseFloat(item.total_revenue)
    })),
    daily_sales: dailySales.map(day => ({
      date: day.date,
      sales_count: parseInt(day.sales_count),
      daily_revenue: parseFloat(day.daily_revenue)
    }))
  };
};

// Obtener estadísticas generales para el dashboard
export const getDashboardStats = async ({ userId }) => {
  // Usar fecha local del servidor (evitar problemas de zona horaria)
  const now = new Date();
  const today = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');

  const startOfMonth = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-01';

  // Estadísticas de ventas del día y del mes
  const salesStats = await Sale.findOne({
    where: { user_id: userId },
    attributes: [
      [
        sequelize.fn('COALESCE',
          sequelize.fn('SUM',
            sequelize.literal(`CASE WHEN DATE(created_at) = '${today}' THEN total_amount ELSE 0 END`)
          ), 0
        ), 'today_sales'
      ],
      [
        sequelize.fn('COALESCE',
          sequelize.fn('SUM',
            sequelize.literal(`CASE WHEN DATE(created_at) >= '${startOfMonth}' THEN total_amount ELSE 0 END`)
          ), 0
        ), 'month_sales'
      ],
      [
        sequelize.fn('COUNT',
          sequelize.literal(`CASE WHEN DATE(created_at) = '${today}' THEN 1 END`)
        ), 'today_sales_count'
      ],
      [
        sequelize.fn('COUNT',
          sequelize.literal(`CASE WHEN DATE(created_at) >= '${startOfMonth}' THEN 1 END`)
        ), 'month_sales_count'
      ]
    ],
    raw: true
  });

  // Estadísticas de productos
  const productStats = await Product.findOne({
    where: { user_id: userId },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_products'],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('stock')), 0), 'total_stock'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN stock <= 5 THEN 1 END')), 'low_stock_products']
    ],
    raw: true
  });

  // Estadísticas de ferias
  const fairStats = await Fair.findOne({
    where: { user_id: userId },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_fairs'],
      [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'active' THEN 1 END")), 'active_fairs']
    ],
    raw: true
  });

  // Calcular porcentajes de cambio (comparar con mes anterior)
  const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];
  const endLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0];

  const lastMonthStats = await Sale.findOne({
    where: {
      user_id: userId,
      created_at: {
        [Op.between]: [new Date(lastMonth), new Date(endLastMonth + ' 23:59:59')]
      }
    },
    attributes: [
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_amount')), 0), 'last_month_sales']
    ],
    raw: true
  });

  const monthlyChange = lastMonthStats.last_month_sales > 0
    ? ((salesStats.month_sales - lastMonthStats.last_month_sales) / lastMonthStats.last_month_sales * 100).toFixed(1)
    : salesStats.month_sales > 0 ? 100 : 0;

  return {
    sales: {
      today: salesStats.today_sales,
      month: salesStats.month_sales,
      todayCount: salesStats.today_sales_count,
      monthCount: salesStats.month_sales_count,
      monthlyChange: monthlyChange
    },
    products: {
      total: productStats.total_products,
      totalStock: productStats.total_stock,
      lowStock: productStats.low_stock_products
    },
    fairs: {
      total: fairStats.total_fairs,
      active: fairStats.active_fairs
    }
  };
};

// Procesar imagen de código de barras (placeholder para futuro)
export const processBarcodeImage = async ({ imageData, format = 'jpg', maxWidth = 1000, maxHeight = 1000 }) => {
  // TODO: Implementar procesamiento de imagen con ML/AI
  // Por ahora, devolvemos un placeholder

  // Validación básica del formato base64
  if (!imageData.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
    throw badRequest('Formato de imagen inválido');
  }

  return {
    message: 'Funcionalidad de procesamiento de imágenes en desarrollo',
    detectedBarcode: null,
    suggestions: [],
    processedImage: {
      format,
      maxWidth,
      maxHeight,
      originalSize: imageData.length
    }
  };
};