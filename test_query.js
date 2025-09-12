const { pool } = require('./src/config/database');

async function testQuery() {
  try {
    // Primero ver qué fechas tienen ventas en la feria 6
    const datesQuery = `
      SELECT 
        DATE(s.created_at) as sale_date,
        COUNT(DISTINCT s.id) as total_sales
      FROM sales s
      WHERE s.fair_id = 6
      GROUP BY DATE(s.created_at)
      ORDER BY sale_date DESC
    `;

    const [dates] = await pool.execute(datesQuery);
    console.log('Fechas con ventas en la feria 6:', dates);

    if (dates.length > 0) {
      const testDate = dates[0].sale_date;
      console.log(`\nAnalizando el día: ${testDate}`);

      // Consulta para verificar ventas de esa fecha
      const query = `
        SELECT 
          DATE(s.created_at) as sale_date,
          COUNT(DISTINCT s.id) as total_sales,
          SUM(s.total_amount) as total_revenue,
          SUM(CASE WHEN s.payment_method = 'cash' THEN 1 ELSE 0 END) as cash_sales,
          SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount ELSE 0 END) as cash_revenue,
          SUM(CASE WHEN s.payment_method = 'transfer' THEN 1 ELSE 0 END) as transfer_sales,
          SUM(CASE WHEN s.payment_method = 'transfer' THEN s.total_amount ELSE 0 END) as transfer_revenue
        FROM sales s
        WHERE s.fair_id = 6 AND DATE(s.created_at) = ?
        GROUP BY DATE(s.created_at)
      `;

      const [result] = await pool.execute(query, [testDate]);
      console.log('Resultado de la consulta:', result[0]);

      // También verificar las ventas individuales
      const detailQuery = `
        SELECT 
          s.id,
          s.total_amount,
          s.payment_method,
          s.created_at
        FROM sales s
        WHERE s.fair_id = 6 AND DATE(s.created_at) = ?
        ORDER BY s.created_at
      `;

      const [details] = await pool.execute(detailQuery, [testDate]);
      console.log('\nVerificación manual:');
      console.log('Total ventas:', details.length);
      console.log('Ventas en efectivo:', details.filter(s => s.payment_method === 'cash').length);
      console.log('Ventas en transferencia:', details.filter(s => s.payment_method === 'transfer').length);
      
      // Verificar si la suma está bien
      const cashCount = details.filter(s => s.payment_method === 'cash').length;
      const transferCount = details.filter(s => s.payment_method === 'transfer').length;
      console.log('Suma manual:', cashCount + transferCount, '(debería ser igual al total)');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuery();
