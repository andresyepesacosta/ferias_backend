const { pool } = require('../config/database');

/**
 * Controlador para generación de reportes
 */
class ReportsController {

  /**
   * Obtener reporte diario de una feria
   */
  static async getFairDailyReport(req, res) {
    try {
      const userId = req.user.id;
      const fairId = req.params.fairId;

      // Verificar que la feria pertenece al usuario
      const [fairCheck] = await pool.execute(
        'SELECT id, name, start_date, end_date FROM fairs WHERE id = ? AND user_id = ?',
        [fairId, userId]
      );

      if (fairCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feria no encontrada'
        });
      }

      const fair = fairCheck[0];

      // Obtener datos de ventas agrupados por día
      const dailyQuery = `
        SELECT 
          DATE(s.created_at) as sale_date,
          COUNT(DISTINCT s.id) as total_sales,
          SUM(s.total_amount) as total_revenue,
          SUM(CASE WHEN s.payment_method = 'cash' THEN 1 ELSE 0 END) as cash_sales,
          SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount ELSE 0 END) as cash_revenue,
          SUM(CASE WHEN s.payment_method = 'transfer' THEN 1 ELSE 0 END) as transfer_sales,
          SUM(CASE WHEN s.payment_method = 'transfer' THEN s.total_amount ELSE 0 END) as transfer_revenue,
          AVG(s.total_amount) as average_sale
        FROM sales s
        WHERE s.fair_id = ?
        GROUP BY DATE(s.created_at)
        ORDER BY sale_date DESC
      `;

      const [dailyData] = await pool.execute(dailyQuery, [fairId]);

      // Para cada día, obtener los productos más vendidos y total de productos
      const dailyReports = await Promise.all(
        dailyData.map(async (day) => {
          // Consulta separada para productos vendidos en el día
          const productsCountQuery = `
            SELECT SUM(si.quantity) as total_products
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.fair_id = ? AND DATE(s.created_at) = ?
          `;

          const [productsCount] = await pool.execute(productsCountQuery, [fairId, day.sale_date]);

          const topProductsQuery = `
            SELECT 
              p.id,
              p.name,
              SUM(si.quantity) as quantity_sold,
              SUM(si.quantity * si.unit_price) as revenue
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE s.fair_id = ? AND DATE(s.created_at) = ?
            GROUP BY p.id, p.name
            ORDER BY quantity_sold DESC
            LIMIT 5
          `;

          const [topProducts] = await pool.execute(topProductsQuery, [fairId, day.sale_date]);

          return {
            date: day.sale_date,
            total_sales: parseInt(day.total_sales),
            total_revenue: parseFloat(day.total_revenue || 0),
            cash_sales: parseInt(day.cash_sales),
            cash_revenue: parseFloat(day.cash_revenue || 0),
            transfer_sales: parseInt(day.transfer_sales),
            transfer_revenue: parseFloat(day.transfer_revenue || 0),
            products_sold: parseInt(productsCount[0]?.total_products || 0),
            average_sale: parseFloat(day.average_sale || 0),
            top_products: topProducts.map(product => ({
              id: product.id,
              name: product.name,
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

      res.json({
        success: true,
        data: {
          fair_id: parseInt(fairId),
          fair_name: fair.name,
          start_date: fair.start_date,
          end_date: fair.end_date,
          daily_reports: dailyReports,
          summary
        }
      });

    } catch (error) {
      console.error('Error al generar reporte diario de feria:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener reporte de una fecha específica
   */
  static async getDateReport(req, res) {
    try {
      const userId = req.user.id;
      const fairId = req.params.fairId;
      const date = req.params.date;

      // Verificar que la feria pertenece al usuario
      const [fairCheck] = await pool.execute(
        'SELECT id, name FROM fairs WHERE id = ? AND user_id = ?',
        [fairId, userId]
      );

      if (fairCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feria no encontrada'
        });
      }

      // Obtener todas las ventas del día específico
      const salesQuery = `
        SELECT 
          s.id,
          s.total_amount,
          s.payment_method,
          s.created_at,
          COUNT(si.id) as items_count
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.fair_id = ? AND DATE(s.created_at) = ?
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `;

      const [sales] = await pool.execute(salesQuery, [fairId, date]);

      // Obtener productos vendidos en ese día
      const productsQuery = `
        SELECT 
          p.id,
          p.name,
          SUM(si.quantity) as quantity_sold,
          SUM(si.quantity * si.unit_price) as revenue,
          AVG(si.unit_price) as avg_price
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.fair_id = ? AND DATE(s.created_at) = ?
        GROUP BY p.id, p.name
        ORDER BY quantity_sold DESC
      `;

      const [products] = await pool.execute(productsQuery, [fairId, date]);

      // Estadísticas del día
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

      res.json({
        success: true,
        data: {
          date,
          fair_name: fairCheck[0].name,
          stats,
          sales: sales.map(sale => ({
            id: sale.id,
            total_amount: parseFloat(sale.total_amount),
            payment_method: sale.payment_method,
            created_at: sale.created_at,
            items_count: parseInt(sale.items_count)
          })),
          products: products.map(product => ({
            id: product.id,
            name: product.name,
            quantity_sold: parseInt(product.quantity_sold),
            revenue: parseFloat(product.revenue),
            avg_price: parseFloat(product.avg_price)
          }))
        }
      });

    } catch (error) {
      console.error('Error al generar reporte de fecha:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = ReportsController;
