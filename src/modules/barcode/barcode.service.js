import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import { Product, Currency, ProductCategory } from '../../models/index.js';

// Generar código de barras como imagen base64
export const generateBarcodeImage = async ({ barcode, options = {} }) => {
  try {
    if (!barcode) {
      throw new Error('El código de barras es requerido');
    }

    // Validar que el código de barras tenga un formato válido
    if (typeof barcode !== 'string' || barcode.trim().length === 0) {
      throw new Error('El código de barras debe ser una cadena válida');
    }

    // Crear canvas
    const canvas = createCanvas(400, 200);

    // Configuración del código de barras
    const barcodeOptions = {
      format: "CODE128",
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 14,
      textMargin: 10,
      ...options
    };

    // Generar código de barras
    JsBarcode(canvas, barcode.trim(), barcodeOptions);

    // Convertir a base64
    const base64 = canvas.toDataURL('image/png');

    return {
      image: base64,
      barcode: barcode.trim(),
      format: barcodeOptions.format
    };

  } catch (error) {
    console.error('Error generando código de barras:', error);
    throw new Error(`Error generando código de barras: ${error.message}`);
  }
};

// Generar etiqueta completa de producto con fechas opcionales
export const generateProductLabel = async ({ productId, userId, dates = {} }) => {
  try {
    // Validar parámetros requeridos
    if (!productId) {
      throw new Error('El ID del producto es requerido');
    }

    if (!userId) {
      throw new Error('El ID del usuario es requerido');
    }

    // Buscar el producto
    const product = await Product.findOne({
      where: {
        id: productId,
        user_id: userId,
        is_active: true
      },
      include: [
        {
          model: Currency,
          as: 'currency',
          attributes: ['code', 'symbol']
        },
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    if (!product.barcode) {
      throw new Error('El producto no tiene código de barras asignado');
    }

    const { elaborationDate, expirationDate } = dates;

    // Validar fechas si se proporcionan
    if (elaborationDate && !isValidDate(elaborationDate)) {
      throw new Error('La fecha de elaboración no es válida');
    }

    if (expirationDate && !isValidDate(expirationDate)) {
      throw new Error('La fecha de vencimiento no es válida');
    }

    // Crear canvas más grande para incluir información adicional
    const canvas = createCanvas(400, 350);
    const ctx = canvas.getContext('2d');

    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 350);

    // Configurar fuente
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';

    let yPosition = 30;

    // Nombre del producto
    ctx.fillText(product.name, 200, yPosition);
    yPosition += 30;

    // Categoría del producto
    if (product.category) {
      ctx.font = '12px Arial';
      ctx.fillText(`Categoría: ${product.category.name}`, 200, yPosition);
      yPosition += 25;
    }

    // Precio con moneda
    if (product.price && product.currency) {
      ctx.font = 'bold 14px Arial';
      const priceText = `${product.currency.symbol}${product.price.toLocaleString()}`;
      ctx.fillText(`Precio: ${priceText}`, 200, yPosition);
      yPosition += 30;
    }

    // Fecha de elaboración
    if (elaborationDate) {
      ctx.font = '12px Arial';
      const formattedDate = new Date(elaborationDate).toLocaleDateString();
      ctx.fillText(`Elaborado: ${formattedDate}`, 200, yPosition);
      yPosition += 20;
    }

    // Fecha de vencimiento
    if (expirationDate) {
      ctx.font = '12px Arial';
      const formattedDate = new Date(expirationDate).toLocaleDateString();
      ctx.fillText(`Vence: ${formattedDate}`, 200, yPosition);
      yPosition += 25;
    }

    // Espacio antes del código de barras
    yPosition += 15;

    // Generar código de barras en la parte inferior
    const barcodeCanvas = createCanvas(350, 100);
    JsBarcode(barcodeCanvas, product.barcode, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 12,
      textMargin: 5
    });

    // Dibujar el código de barras en el canvas principal
    ctx.drawImage(barcodeCanvas, 25, yPosition);

    // Convertir a base64
    const labelImage = canvas.toDataURL('image/png');

    return {
      image: labelImage,
      product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        currency: product.currency
      },
      dates: {
        elaborationDate,
        expirationDate
      }
    };

  } catch (error) {
    console.error('Error generando etiqueta de producto:', error);
    throw new Error(`Error generando etiqueta: ${error.message}`);
  }
};

// Generar código de barras personalizado para cualquier texto
export const generateCustomBarcode = async ({ text, format = 'CODE128', options = {} }) => {
  try {
    if (!text) {
      throw new Error('El texto para el código de barras es requerido');
    }

    // Validar formato
    const validFormats = ['CODE128', 'CODE39', 'EAN13', 'EAN8', 'UPC', 'ITF14'];
    if (!validFormats.includes(format.toUpperCase())) {
      throw new Error(`Formato no válido. Formatos soportados: ${validFormats.join(', ')}`);
    }

    // Crear canvas
    const canvas = createCanvas(400, 200);

    // Configuración del código de barras
    const barcodeOptions = {
      format: format.toUpperCase(),
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 14,
      textMargin: 10,
      ...options
    };

    // Generar código de barras
    JsBarcode(canvas, text, barcodeOptions);

    // Convertir a base64
    const base64 = canvas.toDataURL('image/png');

    return {
      image: base64,
      text: text,
      format: format.toUpperCase()
    };

  } catch (error) {
    console.error('Error generando código de barras personalizado:', error);
    throw new Error(`Error generando código de barras: ${error.message}`);
  }
};

// Validar y buscar producto por código de barras
export const findProductByBarcode = async ({ barcode, userId }) => {
  try {
    if (!barcode) {
      throw new Error('El código de barras es requerido');
    }

    if (!userId) {
      throw new Error('El ID del usuario es requerido');
    }

    const product = await Product.findOne({
      where: {
        barcode: barcode.trim(),
        user_id: userId,
        is_active: true
      },
      include: [
        {
          model: Currency,
          as: 'currency',
          attributes: ['id', 'code', 'symbol', 'name']
        },
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!product) {
      throw new Error('No se encontró un producto con ese código de barras');
    }

    return { product };

  } catch (error) {
    console.error('Error buscando producto por código de barras:', error);
    throw error;
  }
};

// Generar múltiples etiquetas para varios productos
export const generateMultipleLabels = async ({ productIds, userId, dates = {} }) => {
  try {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Se requiere un array de IDs de productos');
    }

    if (!userId) {
      throw new Error('El ID del usuario es requerido');
    }

    const labels = [];
    const errors = [];

    for (const productId of productIds) {
      try {
        const label = await generateProductLabel({ productId, userId, dates });
        labels.push(label);
      } catch (error) {
        errors.push({
          productId,
          error: error.message
        });
      }
    }

    return {
      labels,
      errors,
      summary: {
        total: productIds.length,
        successful: labels.length,
        failed: errors.length
      }
    };

  } catch (error) {
    console.error('Error generando múltiples etiquetas:', error);
    throw new Error(`Error generando etiquetas: ${error.message}`);
  }
};

// Función helper para validar formato de fecha
const isValidDate = (dateString) => {
  if (!dateString) return true; // Las fechas son opcionales
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date >= new Date('1900-01-01');
};
