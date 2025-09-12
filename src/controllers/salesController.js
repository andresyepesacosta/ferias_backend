const { pool } = require('../config/database');

// Obtener todas las ventas de una feria
const getSalesByFair = async (req, res) => {
  try {
    const { fairId } = req.params;
    const userId = req.user.id;
    
    const [sales] = await pool.execute(`
      SELECT 
        s.*,
        f.name as fair_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as items_count
      FROM sales s
      JOIN fairs f ON s.fair_id = f.id
      WHERE s.fair_id = ? AND s.user_id = ?
      ORDER BY s.sale_date DESC
    `, [fairId, userId]);

    res.json(sales);
  } catch (error) {
    console.error('Error getting sales by fair:', error);
    res.status(500).json({ message: 'Error al obtener las ventas' });
  }
};

// Obtener detalles de una venta específica
const getSaleDetails = async (req, res) => {
  try {
    const { saleId } = req.params;
    const userId = req.user.id;

    // Obtener información de la venta
    const [saleData] = await pool.execute(`
      SELECT s.*, f.name as fair_name
      FROM sales s
      JOIN fairs f ON s.fair_id = f.id
      WHERE s.id = ? AND s.user_id = ?
    `, [saleId, userId]);

    if (saleData.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Obtener items de la venta
    const [items] = await pool.execute(`
      SELECT 
        si.*,
        p.name as product_name,
        p.barcode,
        p.price as original_price
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
      ORDER BY si.id
    `, [saleId]);

    res.json({
      sale: saleData[0],
      items: items
    });
  } catch (error) {
    console.error('Error getting sale details:', error);
    res.status(500).json({ message: 'Error al obtener los detalles de la venta' });
  }
};

// Crear una nueva venta
const createSale = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { fairId, items, paymentMethod, notes } = req.body;
    const userId = req.user.id;

    // Validar que la feria pertenezca al usuario
    const [fairCheck] = await connection.execute(
      'SELECT id FROM fairs WHERE id = ? AND user_id = ?',
      [fairId, userId]
    );

    if (fairCheck.length === 0) {
      return res.status(404).json({ message: 'Feria no encontrada' });
    }

    // Calcular el total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    // Crear la venta
    const [saleResult] = await connection.execute(`
      INSERT INTO sales (fair_id, user_id, total_amount, payment_method, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [fairId, userId, totalAmount, paymentMethod, notes || null]);

    const saleId = saleResult.insertId;

    // Insertar los items de la venta
    for (const item of items) {
      const subtotal = item.quantity * item.unitPrice;
      
      await connection.execute(`
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `, [saleId, item.productId, item.quantity, item.unitPrice, subtotal]);

      // Actualizar el stock del producto (opcional)
      await connection.execute(`
        UPDATE products 
        SET stock = GREATEST(0, stock - ?)
        WHERE id = ? AND user_id = ?
      `, [item.quantity, item.productId, userId]);
    }

    await connection.commit();

    // Obtener la venta creada con todos sus detalles
    const [newSale] = await connection.execute(`
      SELECT 
        s.*,
        f.name as fair_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as items_count
      FROM sales s
      JOIN fairs f ON s.fair_id = f.id
      WHERE s.id = ?
    `, [saleId]);

    res.status(201).json({
      message: 'Venta creada exitosamente',
      sale: newSale[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Error al crear la venta' });
  } finally {
    connection.release();
  }
};

// Buscar productos por nombre o código de barras
const searchProducts = async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user.id;

    if (!search || search.length < 2) {
      return res.json([]);
    }

    const [products] = await pool.execute(`
      SELECT 
        id,
        name,
        price,
        stock,
        barcode,
        image_url
      FROM products 
      WHERE user_id = ? 
        AND status = 'active'
        AND (
          name LIKE ? 
          OR barcode = ?
          OR barcode LIKE ?
        )
      ORDER BY 
        CASE 
          WHEN barcode = ? THEN 1
          WHEN name LIKE ? THEN 2
          ELSE 3
        END,
        name
      LIMIT 20
    `, [
      userId, 
      `%${search}%`, 
      search, 
      `%${search}%`,
      search,
      `${search}%`
    ]);

    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Error al buscar productos' });
  }
};

// Obtener estadísticas de ventas de una feria
const getFairSalesStats = async (req, res) => {
  try {
    const { fairId } = req.params;
    const userId = req.user.id;

    // Verificar que la feria pertenezca al usuario
    const [fairCheck] = await pool.execute(
      'SELECT id FROM fairs WHERE id = ? AND user_id = ?',
      [fairId, userId]
    );

    if (fairCheck.length === 0) {
      return res.status(404).json({ message: 'Feria no encontrada' });
    }

    // Estadísticas generales
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(s.id) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(AVG(s.total_amount), 0) as average_sale,
        COUNT(CASE WHEN s.payment_method = 'cash' THEN 1 END) as cash_sales,
        COUNT(CASE WHEN s.payment_method = 'transfer' THEN 1 END) as transfer_sales,
        COALESCE(SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount ELSE 0 END), 0) as cash_revenue,
        COALESCE(SUM(CASE WHEN s.payment_method = 'transfer' THEN s.total_amount ELSE 0 END), 0) as transfer_revenue
      FROM sales s
      WHERE s.fair_id = ? AND s.user_id = ?
    `, [fairId, userId]);

    // Productos más vendidos en esta feria
    const [topProducts] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.price as original_price,
        SUM(si.quantity) as quantity_sold,
        AVG(si.unit_price) as avg_selling_price,
        SUM(si.total_price) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.fair_id = ? AND s.user_id = ?
      GROUP BY p.id, p.name, p.price
      ORDER BY quantity_sold DESC
      LIMIT 10
    `, [fairId, userId]);

    // Ventas por día
    const [dailySales] = await pool.execute(`
      SELECT 
        DATE(s.sale_date) as sale_date,
        COUNT(s.id) as sales_count,
        SUM(s.total_amount) as daily_revenue
      FROM sales s
      WHERE s.fair_id = ? AND s.user_id = ?
      GROUP BY DATE(s.sale_date)
      ORDER BY sale_date DESC
      LIMIT 30
    `, [fairId, userId]);

    res.json({
      general: stats[0],
      topProducts,
      dailySales
    });

  } catch (error) {
    console.error('Error getting fair sales stats:', error);
    res.status(500).json({ message: 'Error al obtener las estadísticas' });
  }
};

// Procesar imagen de código de barras (placeholder para futuro)
const processBarcodeImage = async (req, res) => {
  try {
    // TODO: Implementar procesamiento de imagen con ML/AI
    // Por ahora, devolvemos un placeholder
    res.json({
      message: 'Funcionalidad de procesamiento de imágenes en desarrollo',
      detectedBarcode: null,
      suggestions: []
    });
  } catch (error) {
    console.error('Error processing barcode image:', error);
    res.status(500).json({ message: 'Error al procesar la imagen' });
  }
};

// Obtener estadísticas generales para el dashboard
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Usar fecha local del servidor (evitar problemas de zona horaria)
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
    
    const startOfMonth = now.getFullYear() + '-' + 
                        String(now.getMonth() + 1).padStart(2, '0') + '-01';

    // Estadísticas de ventas del día y del mes
    const [salesStats] = await pool.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(sale_date) = ? THEN total_amount ELSE 0 END), 0) as today_sales,
        COALESCE(SUM(CASE WHEN DATE(sale_date) >= ? THEN total_amount ELSE 0 END), 0) as month_sales,
        COUNT(CASE WHEN DATE(sale_date) = ? THEN 1 END) as today_sales_count,
        COUNT(CASE WHEN DATE(sale_date) >= ? THEN 1 END) as month_sales_count
      FROM sales 
      WHERE user_id = ?
    `, [today, startOfMonth, today, startOfMonth, userId]);

    // Estadísticas de productos
    const [productStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(stock), 0) as total_stock,
        COUNT(CASE WHEN stock <= 5 THEN 1 END) as low_stock_products
      FROM products 
      WHERE user_id = ?
    `, [userId]);

    // Estadísticas de ferias
    const [fairStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_fairs,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_fairs
      FROM fairs 
      WHERE user_id = ?
    `, [userId]);

    // Calcular porcentajes de cambio (comparar con mes anterior)
    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];
    const endLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0];

    const [lastMonthStats] = await pool.execute(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as last_month_sales
      FROM sales 
      WHERE user_id = ? AND DATE(sale_date) >= ? AND DATE(sale_date) <= ?
    `, [userId, lastMonth, endLastMonth]);

    const monthlyChange = lastMonthStats[0].last_month_sales > 0 
      ? ((salesStats[0].month_sales - lastMonthStats[0].last_month_sales) / lastMonthStats[0].last_month_sales * 100).toFixed(1)
      : salesStats[0].month_sales > 0 ? 100 : 0;

    res.json({
      sales: {
        today: salesStats[0].today_sales,
        month: salesStats[0].month_sales,
        todayCount: salesStats[0].today_sales_count,
        monthCount: salesStats[0].month_sales_count,
        monthlyChange: monthlyChange
      },
      products: {
        total: productStats[0].total_products,
        totalStock: productStats[0].total_stock,
        lowStock: productStats[0].low_stock_products
      },
      fairs: {
        total: fairStats[0].total_fairs,
        active: fairStats[0].active_fairs
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error al obtener las estadísticas' });
  }
};

module.exports = {
  getSalesByFair,
  getSaleDetails,
  createSale,
  searchProducts,
  getFairSalesStats,
  processBarcodeImage,
  getDashboardStats
};
