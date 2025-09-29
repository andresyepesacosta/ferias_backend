import * as saleService from './sale.service.js';

// Obtener todas las ventas de una feria
export const getSalesByFair = async (req, res, next) => {
  try {
    const { fairId } = req.params;
    const userId = req.user.id;

    const result = await saleService.getSalesByFair({ userId, fairId });

    res.status(200).json({
      success: true,
      data: { sales: result.sales }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener detalles de una venta específica
export const getSaleDetails = async (req, res, next) => {
  try {
    const { saleId } = req.params;
    const userId = req.user.id;

    const result = await saleService.getSaleDetails({ userId, saleId });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Crear una nueva venta
export const createSale = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const saleData = req.body;

    const result = await saleService.createSale({ userId, saleData });

    res.status(201).json({
      success: true,
      data: { sale: result.sale },
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// Buscar productos por nombre o código de barras
export const searchProducts = async (req, res, next) => {
  try {
    const { search, fairId, category, limit } = req.query;
    const userId = req.user.id;

    const result = await saleService.searchProducts({ userId, search, fairId, category, limit });

    res.status(200).json({
      success: true,
      data: { products: result.products }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de ventas de una feria
export const getFairSalesStats = async (req, res, next) => {
  try {
    const { fairId } = req.params;
    const userId = req.user.id;

    const result = await saleService.getFairSalesStats({ userId, fairId });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Procesar imagen de código de barras (placeholder para futuro)
export const processBarcodeImage = async (req, res, next) => {
  try {
    const { imageData, format, maxWidth, maxHeight } = req.body;

    const result = await saleService.processBarcodeImage({ imageData, format, maxWidth, maxHeight });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas generales para el dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period, startDate, endDate, timezone } = req.query;

    const result = await saleService.getDashboardStats({ userId, period, startDate, endDate, timezone });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
