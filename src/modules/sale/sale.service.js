import { Product, Fair, User } from '../../models/index.js';
import Sale from './sale.model.js';
import SaleItem from './saleItem.model.js';
import { Op } from 'sequelize';
import sequelize from '../../config/sequelize.js';

// Obtener todas las ventas de una feria
export const getSalesByFair = async ({ userId, fairId }) => {
  try {
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
  } catch (error) {
    console.error('Error obteniendo ventas por feria:', error);
    throw new Error('Error al obtener las ventas de la feria');
  }
};

// Obtener detalles de una venta específica
export const getSaleDetails = async ({ userId, saleId }) => {
  try {
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
      throw new Error('Venta no encontrada');
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
  } catch (error) {
    console.error('Error obteniendo detalles de venta:', error);
    throw error;
  }
};

// Crear una nueva venta
export const createSale = async ({ userId, saleData }) => {
  const transaction = await sequelize.transaction();

  try {
    const { fairId, items, paymentMethod, notes } = saleData;

    // Validar datos requeridos
    if (!fairId) {
      throw new Error('El ID de la feria es requerido');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Se requiere al menos un item para la venta');
    }

    if (!paymentMethod) {
      throw new Error('El método de pago es requerido');
    }

    // Validar que la feria pertenezca al usuario
    const fair = await Fair.findOne({
      where: { 
        id: fairId, 
        user_id: userId,
        is_active: true 
      }
    });

    if (!fair) {
      throw new Error('Feria no encontrada');
    }

    // Validar y calcular el total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        throw new Error('Todos los items deben tener productId, quantity y unitPrice');
      }

      if (item.quantity <= 0 || item.unitPrice < 0) {
        throw new Error('La cantidad debe ser mayor a 0 y el precio no puede ser negativo');
      }

      // Verificar que el producto existe y pertenece al usuario
      const product = await Product.findOne({
        where: { 
          id: item.productId, 
          user_id: userId,
          is_active: true 
        }
      });

      if (!product) {
        throw new Error(`Producto con ID ${item.productId} no encontrado`);
      }

      const subtotal = item.quantity * item.unitPrice;
      totalAmount += subtotal;

      validatedItems.push({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: subtotal
      });
    }

    // Crear la venta
    const sale = await Sale.create({
      fair_id: fairId,
      user_id: userId,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      notes: notes || null
    }, { transaction });

    // Insertar los items de la venta
    for (const item of validatedItems) {
      await SaleItem.create({
        sale_id: sale.id,
        ...item
      }, { transaction });

      // Actualizar el stock del producto (opcional)
      await Product.update(
        { 
          stock: sequelize.literal(`GREATEST(0, stock - ${item.quantity})`) 
        },
        { 
          where: { 
            id: item.product_id, 
            user_id: userId 
          },
          transaction 
        }
      );
    }

    await transaction.commit();

    // Obtener la venta creada con todos sus detalles
    const { sale: completeSale } = await getSaleDetails({ userId, saleId: sale.id });

    return { 
      sale: completeSale,
      message: 'Venta creada exitosamente'
    };

  } catch (error) {
    await transaction.rollback();
    console.error('Error creando venta:', error);
    throw error;
  }
};

// Buscar productos por nombre o código de barras
export const searchProducts = async ({ userId, search }) => {
  try {
    if (!search || search.length < 2) {
      return { products: [] };
    }

    const products = await Product.findAll({
      where: {
        user_id: userId,
        is_active: true,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { barcode: search },
          { barcode: { [Op.like]: `%${search}%` } }
        ]
      },
      attributes: ['id', 'name', 'price', 'stock', 'barcode', 'image_url'],
      order: [
        [sequelize.literal(`
          CASE 
            WHEN barcode = '${search}' THEN 1
            WHEN name LIKE '${search}%' THEN 2
            ELSE 3
          END
        `), 'ASC'],
        ['name', 'ASC']
      ],
      limit: 20
    });

    return { products };
  } catch (error) {
    console.error('Error buscando productos:', error);
    throw new Error('Error al buscar productos');
  }
};

// Obtener estadísticas de ventas de una feria
export const getFairSalesStats = async ({ userId, fairId }) => {
  try {
    // Verificar que la feria pertenezca al usuario
    const fair = await Fair.findOne({
      where: { 
        id: fairId, 
        user_id: userId,
        is_active: true 
      }
    });

    if (!fair) {
      throw new Error('Feria no encontrada');
    }

    // Estadísticas generales
    const generalStats = await Sale.findOne({
      where: { 
        fair_id: fairId, 
        user_id: userId 
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_sales'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_amount')), 0), 'total_revenue'],
        [sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('total_amount')), 0), 'average_sale'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN payment_method = 'cash' THEN 1 END")), 'cash_sales'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN payment_method = 'transfer' THEN 1 END")), 'transfer_sales'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END")), 0), 'cash_revenue'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END")), 0), 'transfer_revenue']
      ],
      raw: true
    });

    // Productos más vendidos en esta feria
    const topProducts = await SaleItem.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('quantity')), 'quantity_sold'],
        [sequelize.fn('AVG', sequelize.col('unit_price')), 'avg_selling_price'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'total_revenue']
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
          where: { 
            fair_id: fairId, 
            user_id: userId 
          },
          attributes: []
        }
      ],
      group: ['product.id', 'product.name', 'product.price'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Ventas por día
    const dailySales = await Sale.findAll({
      where: { 
        fair_id: fairId, 
        user_id: userId 
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'sale_date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'sales_count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'daily_revenue']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
      limit: 30,
      raw: true
    });

    return {
      general: generalStats,
      topProducts: topProducts.map(product => ({
        id: product['product.id'],
        name: product['product.name'],
        original_price: product['product.price'],
        quantity_sold: parseInt(product.quantity_sold),
        avg_selling_price: parseFloat(product.avg_selling_price),
        total_revenue: parseFloat(product.total_revenue)
      })),
      dailySales: dailySales.map(day => ({
        sale_date: day.sale_date,
        sales_count: parseInt(day.sales_count),
        daily_revenue: parseFloat(day.daily_revenue)
      }))
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas de ventas:', error);
    throw error;
  }
};

// Obtener estadísticas generales para el dashboard
export const getDashboardStats = async ({ userId }) => {
  try {
    // Fechas para comparación
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    // Estadísticas de ventas del día y del mes
    const salesStats = await Sale.findOne({
      where: { user_id: userId },
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.literal(`CASE WHEN DATE(created_at) = '${today}' THEN total_amount ELSE 0 END`)), 0), 'today_sales'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.literal(`CASE WHEN DATE(created_at) >= '${startOfMonth}' THEN total_amount ELSE 0 END`)), 0), 'month_sales'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN DATE(created_at) = '${today}' THEN 1 END`)), 'today_sales_count'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN DATE(created_at) >= '${startOfMonth}' THEN 1 END`)), 'month_sales_count']
      ],
      raw: true
    });

    // Estadísticas de productos
    const productStats = await Product.findOne({
      where: { 
        user_id: userId,
        is_active: true 
      },
      attributes: [
        [sequelize.fn('COUNT', '*'), 'total_products'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('stock')), 0), 'total_stock'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN stock <= 5 THEN 1 END')), 'low_stock_products']
      ],
      raw: true
    });

    // Estadísticas de ferias
    const fairStats = await Fair.findOne({
      where: { 
        user_id: userId,
        is_active: true 
      },
      attributes: [
        [sequelize.fn('COUNT', '*'), 'total_fairs'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'active' THEN 1 END")), 'active_fairs']
      ],
      raw: true
    });

    // Ventas del mes anterior para calcular cambio porcentual
    const lastMonthStats = await Sale.findOne({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: lastMonth,
          [Op.lte]: endLastMonth + ' 23:59:59'
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
        today: parseFloat(salesStats.today_sales),
        month: parseFloat(salesStats.month_sales),
        todayCount: parseInt(salesStats.today_sales_count),
        monthCount: parseInt(salesStats.month_sales_count),
        monthlyChange: parseFloat(monthlyChange)
      },
      products: {
        total: parseInt(productStats.total_products),
        totalStock: parseInt(productStats.total_stock),
        lowStock: parseInt(productStats.low_stock_products)
      },
      fairs: {
        total: parseInt(fairStats.total_fairs),
        active: parseInt(fairStats.active_fairs)
      }
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    throw new Error('Error al obtener las estadísticas del dashboard');
  }
};

// Procesar imagen de código de barras (placeholder para futuro)
export const processBarcodeImage = async ({ imageData }) => {
  try {
    // TODO: Implementar procesamiento de imagen con ML/AI
    // Por ahora, devolvemos un placeholder
    return {
      message: 'Funcionalidad de procesamiento de imágenes en desarrollo',
      detectedBarcode: null,
      suggestions: []
    };
  } catch (error) {
    console.error('Error procesando imagen de código de barras:', error);
    throw new Error('Error al procesar la imagen');
  }
};
