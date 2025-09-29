import * as productService from './product.service.js';
import * as scannerService from '../scanning/scanner.service.js';

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
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    await productService.deleteProduct({ userId, productId });

    res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

// Generar código de barras para producto específico
export const generateBarcode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    const result = await productService.generateProductBarcode({ userId, productId });

    // Enviar como imagen
    const base64Data = result.image.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="barcode_${result.productName.replace(/\s+/g, '_')}.png"`
    });

    res.send(imageBuffer);

  } catch (error) {
    next(error);
  }
};

// Generar etiqueta de producto con fechas opcionales
export const generateProductLabelWithDates = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const { elaborationDate, expirationDate } = req.body;

    const result = await productService.generateProductLabelWithDates({
      userId,
      productId,
      dates: { elaborationDate, expirationDate }
    });

    // Enviar como imagen
    const base64Data = result.labelImage.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="etiqueta_${result.productName.replace(/\s+/g, '_')}.png"`
    });

    res.send(imageBuffer);

  } catch (error) {
    next(error);
  }
};


