import * as reportService from './report.service.js';

// Controlador para obtener reporte diario de una feria
export const getFairDailyReport = async (req, res) => {
  const { fairId } = req.params;
  const userId = req.user.id;

  const report = await reportService.getFairDailyReport({ 
    userId, 
    fairId: parseInt(fairId) 
  });
  
  res.json(report);
};

// Controlador para obtener reporte de una fecha específica
export const getDateReport = async (req, res) => {
  const { fairId, date } = req.params;
  const userId = req.user.id;

  const report = await reportService.getDateReport({ 
    userId, 
    fairId: parseInt(fairId), 
    date 
  });
  
  res.json(report);
};
