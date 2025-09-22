import * as productService from './product.service.js';
import * as barcodeService from '../barcode/barcode.service.js';

export const getProducts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { products } = await productService.getProducts({ userId });

    res.status(200).json({
      success: true,
      data: {
        products
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    const { product } = await productService.getProductById({ userId, productId });

    res.status(200).json({
      success: true,
      data: {
        product
      }
    });

  } catch (error) {
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productData = req.body;

    const { product } = await productService.createProduct({ userId, productData });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        product
      }
    });

  } catch (error) {
    if (error.message.includes('requerido') || 
        error.message.includes('mayor o igual')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const updateData = req.body;

    const { product } = await productService.updateProduct({ userId, productId, updateData });

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        product
      }
    });

  } catch (error) {
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('campos para actualizar')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    const { message } = await productService.deleteProduct({ userId, productId });

    res.status(200).json({
      success: true,
      message
    });

  } catch (error) {
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const generateBarcode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    const { barcodeImage, productName } = await productService.generateBarcodeForProduct({ 
      userId, 
      productId 
    });

    // Enviar como imagen
    const base64Data = barcodeImage.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="barcode_${productName.replace(/\s+/g, '_')}.png"`
    });
    
    res.send(imageBuffer);

  } catch (error) {
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const generateProductLabelWithDates = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const { elaborationDate, expirationDate } = req.body;

    const { labelImage, productName } = await productService.generateProductLabelWithDates({ 
      userId, 
      productId, 
      elaborationDate, 
      expirationDate 
    });

    // Enviar como imagen
    const base64Data = labelImage.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="etiqueta_${productName.replace(/\s+/g, '_')}.png"`
    });
    
    res.send(imageBuffer);

  } catch (error) {
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('inválida')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// Generar etiqueta completa de producto (usando barcode service)
export const generateProductLabel = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const { dates } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del producto es requerido'
      });
    }

    const result = await barcodeService.generateProductLabel({ 
      productId: parseInt(productId), 
      userId, 
      dates 
    });

    res.status(200).json({
      success: true,
      message: 'Etiqueta generada exitosamente',
      data: result
    });

  } catch (error) {
    if (error.message.includes('no encontrado') || 
        error.message.includes('requerido') ||
        error.message.includes('válida') ||
        error.message.includes('código de barras')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// Generar múltiples etiquetas de productos
export const generateMultipleProductLabels = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productIds, dates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de productos'
      });
    }

    // Validar que todos sean números
    const validIds = productIds.filter(id => Number.isInteger(parseInt(id)));
    if (validIds.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Todos los IDs de productos deben ser números válidos'
      });
    }

    const result = await barcodeService.generateMultipleLabels({ 
      productIds: validIds.map(id => parseInt(id)), 
      userId, 
      dates 
    });

    res.status(200).json({
      success: true,
      message: 'Proceso de generación completado',
      data: result
    });

  } catch (error) {
    if (error.message.includes('array') || error.message.includes('requerido')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// Buscar producto por código de barras
export const findProductByBarcode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'El código de barras es requerido'
      });
    }

    const result = await barcodeService.findProductByBarcode({ 
      barcode: decodeURIComponent(barcode), 
      userId 
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    if (error.message.includes('No se encontró')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('requerido')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
