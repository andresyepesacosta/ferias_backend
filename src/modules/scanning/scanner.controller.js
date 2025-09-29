import * as scannerService from './scanner.service.js';

// Generar código de barras simple
export const generateBarcode = async (req, res, next) => {
  try {
    const { barcode, options } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'El código de barras es requerido'
      });
    }

    const result = await scannerService.generateBarcodeImage({ barcode, options });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    if (error.message.includes('requerido') || error.message.includes('válida')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};



