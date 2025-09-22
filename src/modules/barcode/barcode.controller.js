import * as barcodeService from './barcode.service.js';

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

    const result = await barcodeService.generateBarcodeImage({ barcode, options });

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

// Generar código de barras personalizado
export const generateCustomBarcode = async (req, res, next) => {
  try {
    const { text, format, options } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'El texto para el código de barras es requerido'
      });
    }

    const result = await barcodeService.generateCustomBarcode({ 
      text, 
      format, 
      options 
    });

    res.status(200).json({
      success: true,
      message: 'Código de barras personalizado generado exitosamente',
      data: result
    });

  } catch (error) {
    if (error.message.includes('requerido') || 
        error.message.includes('Formato no válido') ||
        error.message.includes('soportados')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// Obtener formatos soportados de códigos de barras
export const getSupportedFormats = async (req, res, next) => {
  try {
    const formats = [
      {
        code: 'CODE128',
        name: 'Code 128',
        description: 'Formato estándar, soporta caracteres alfanuméricos',
        recommended: true
      },
      {
        code: 'CODE39',
        name: 'Code 39',
        description: 'Formato más antiguo, solo caracteres específicos',
        recommended: false
      },
      {
        code: 'EAN13',
        name: 'EAN-13',
        description: 'Código de barras europeo de 13 dígitos',
        recommended: true
      },
      {
        code: 'EAN8',
        name: 'EAN-8',
        description: 'Código de barras europeo de 8 dígitos',
        recommended: false
      },
      {
        code: 'UPC',
        name: 'UPC',
        description: 'Código de barras universal (12 dígitos)',
        recommended: true
      },
      {
        code: 'ITF14',
        name: 'ITF-14',
        description: 'Formato para cajas y embalajes',
        recommended: false
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        formats,
        default: 'CODE128'
      }
    });

  } catch (error) {
    next(error);
  }
};

// Validar código de barras
export const validateBarcode = async (req, res, next) => {
  try {
    const { barcode, format = 'CODE128' } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'El código de barras es requerido'
      });
    }

    // Intentar generar el código para validarlo
    try {
      await barcodeService.generateCustomBarcode({ 
        text: barcode, 
        format,
        options: { displayValue: false } // Solo validar, no mostrar
      });

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          barcode,
          format,
          message: 'Código de barras válido'
        }
      });

    } catch (validationError) {
      res.status(200).json({
        success: true,
        data: {
          valid: false,
          barcode,
          format,
          message: 'Código de barras no válido para el formato especificado',
          error: validationError.message
        }
      });
    }

  } catch (error) {
    next(error);
  }
};
