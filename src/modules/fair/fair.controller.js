import * as fairService from './fair.service.js';

export const getFairs = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { fairs } = await fairService.getFairs({ userId });

    res.status(200).json({
      success: true,
      data: fairs
    });

  } catch (error) {
    next(error);
  }
}

export const getFairById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fairId = req.params.id;

    const { fair } = await fairService.getFairById({ userId, fairId });

    res.status(200).json({
      success: true,
      data: fair
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
}

export const createFair = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fairData = req.body;

    const { fair } = await fairService.createFair({ userId, fairData });

    res.status(201).json({
      success: true,
      message: 'Feria creada exitosamente',
      data: fair
    });

  } catch (error) {
    if (error.message.includes('requeridos') ||
      error.message.includes('anterior') ||
      error.message.includes('pasado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

export const updateFair = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fairId = req.params.id;
    const updateData = req.body;

    const { fair } = await fairService.updateFair({ userId, fairId, updateData });

    res.status(200).json({
      success: true,
      message: 'Feria actualizada exitosamente',
      data: fair
    });

  } catch (error) {
    if (error.message === 'Feria no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('anterior') ||
      error.message.includes('proporcionaron campos')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

export const deleteFair = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fairId = req.params.id;

    const { message } = await fairService.deleteFair({ userId, fairId });

    res.status(200).json({
      success: true,
      message
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
}

export const getFairStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { stats } = await fairService.getFairStats({ userId });

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    next(error);
  }
}

export const updateFairExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fairId = req.params.id;
    const { expenses } = req.body;

    const { fair } = await fairService.updateFairExpenses({ userId, fairId, expenses });

    res.status(200).json({
      success: true,
      message: 'Gastos actualizados exitosamente',
      data: fair
    });

  } catch (error) {
    if (error.message === 'Feria no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('requerido') ||
      error.message.includes('número válido')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

export const getFairDailyReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fairId = req.params.fairId;

    const reportData = await fairService.getFairDailyReport({ userId, fairId });

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
}

export const getFairDateReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fairId = req.params.fairId;
    const date = req.params.date;

    const reportData = await fairService.getFairDateReport({ userId, fairId, date });

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
}