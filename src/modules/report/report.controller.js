import * as reportService from './report.service.js';

// Obtener reporte diario de una feria
export const getFairDailyReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fairId = req.params.fairId;

    if (!fairId || !Number.isInteger(parseInt(fairId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de feria inválido'
      });
    }

    const reportData = await reportService.getFairDailyReport({ 
      userId, 
      fairId: parseInt(fairId) 
    });

    res.status(200).json({
      success: true,
      data: reportData
    });

  } catch (error) {
    if (error.message === 'Feria no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// Obtener reporte de una fecha específica
export const getDateReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fairId = req.params.fairId;
    const date = req.params.date;

    if (!fairId || !Number.isInteger(parseInt(fairId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de feria inválido'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Fecha es requerida'
      });
    }

    const reportData = await reportService.getDateReport({ 
      userId, 
      fairId: parseInt(fairId), 
      date 
    });

    res.status(200).json({
      success: true,
      data: reportData
    });

  } catch (error) {
    if (error.message === 'Feria no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('Formato de fecha inválido')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
