import { notFound, badRequest, internal } from "@hapi/boom";
import { ProductCategory, Currency, User } from '../../models/index.js';
import Product from './product.model.js';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

// Generar código de barras único
const generateBarcodeString = (userId, productId) => {
  // Formato: YYYYMMDD + UserID(3 dígitos) + ProductID(4 dígitos)
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const userPart = userId.toString().padStart(3, '0');
  const productPart = productId.toString().padStart(4, '0');
  return `${date}${userPart}${productPart}`;
};

// Generar código de barras como imagen base64 (función auxiliar)
const generateBarcodeImage = async (barcode, options = {}) => {
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
    backgroundColor: '#FFFFFF',
    lineColor: '#000000',
    ...options
  };

  // Generar código de barras
  JsBarcode(canvas, barcode.trim(), barcodeOptions);

  // Convertir a base64
  return canvas.toDataURL('image/png');
};

// Validar si una fecha es válida (función auxiliar)
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  const timestamp = date.getTime();

  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return false;

  return dateString === date.toISOString().split('T')[0];
};

export const getProducts = async ({ userId }) => {
  try {
    const products = await Product.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      attributes: [
        'id',
        'name',
        'description',
        'image_url',
        ['cost', 'manufacturing_cost'],
        ['price', 'final_price'],
        'stock',
        'barcode',
        'is_active',
        'created_at',
        'updated_at',
        'category_id',
        'currency_id',
        'min_stock',
        'sku'
      ],
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
          required: false
        },
        {
          model: Currency,
          as: 'currency',
          attributes: ['id', 'code', 'symbol'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return { products };
  } catch (error) {
    console.error('Error in getProducts service:', error);
    throw internal('Error al obtener los productos del usuario');
  }
};

export const getProductById = async ({ userId, productId }) => {
  try {
    const product = await Product.findOne({
      where: {
        id: productId,
        user_id: userId
      },
      attributes: [
        'id',
        'name',
        'description',
        'image_url',
        ['cost', 'manufacturing_cost'],
        ['price', 'final_price'],
        'stock',
        'barcode',
        'is_active',
        'created_at',
        'updated_at',
        'category_id',
        'currency_id',
        'min_stock',
        'sku'
      ],
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
          required: false
        },
        {
          model: Currency,
          as: 'currency',
          attributes: ['id', 'code', 'symbol'],
          required: false
        }
      ]
    });

    if (!product) {
      throw notFound('Producto no encontrado');
    }

    return { product };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error in getProductById service:', error);
    throw internal('Error al obtener el producto');
  }
};

export const createProduct = async ({ userId, productData }) => {
  const {
    name,
    description,
    manufacturing_cost,
    final_price,
    stock
  } = productData;

  // Crear el producto usando los nombres de campo de la base de datos
  const newProduct = await Product.create({
    user_id: userId,
    name,
    description: description || null,
    cost: manufacturing_cost || 0,  // manufacturing_cost -> cost en la BD
    price: final_price || 0,        // final_price -> price en la BD
    stock: stock || 0
  });

  // Generar código de barras
  const barcode = generateBarcodeString(userId, newProduct.id);

  // Actualizar producto con código de barras
  await newProduct.update({ barcode });

  // Obtener el producto completo con relaciones
  const productWithRelations = await Product.findOne({
    where: { id: newProduct.id },
    attributes: [
      'id',
      'name',
      'description',
      'image_url',
      ['cost', 'manufacturing_cost'],
      ['price', 'final_price'],
      'stock',
      'barcode',
      'is_active',
      'created_at',
      'updated_at',
      'category_id',
      'currency_id',
      'min_stock',
      'sku'
    ],
    include: [
      {
        model: ProductCategory,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon'],
        required: false
      },
      {
        model: Currency,
        as: 'currency',
        attributes: ['id', 'code', 'symbol'],
        required: false
      }
    ]
  });

  return { product: productWithRelations };
};

export const updateProduct = async ({ userId, productId, updateData }) => {
  // Verificar que el producto existe y pertenece al usuario
  const existingProduct = await Product.findOne({
    where: {
      id: productId,
      user_id: userId
    }
  });

  if (!existingProduct) {
    throw notFound('Producto no encontrado');
  }

  // Construir objeto de actualización con mapeo de campos del schema a la BD
  const updates = {};

  // Mapeo de campos del frontend/schema a la base de datos
  const fieldMapping = {
    'manufacturing_cost': 'cost',
    'final_price': 'price'
  };

  Object.keys(updateData).forEach(key => {
    // Usar el mapeo si existe, sino usar el nombre original
    const dbField = fieldMapping[key] || key;
    const fieldValue = updateData[key] === '' ? null : updateData[key];
    updates[dbField] = fieldValue;
  });

  if (Object.keys(updates).length === 0) {
    throw badRequest('No hay campos para actualizar');
  }

  // Actualizar el producto
  await existingProduct.update(updates);

  // Obtener producto actualizado con relaciones
  const updatedProduct = await Product.findOne({
    where: { id: productId },
    attributes: [
      'id',
      'name',
      'description',
      'image_url',
      ['cost', 'manufacturing_cost'],
      ['price', 'final_price'],
      'stock',
      'barcode',
      'is_active',
      'created_at',
      'updated_at',
      'category_id',
      'currency_id',
      'min_stock',
      'sku'
    ],
    include: [
      {
        model: ProductCategory,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon'],
        required: false
      },
      {
        model: Currency,
        as: 'currency',
        attributes: ['id', 'code', 'symbol'],
        required: false
      }
    ]
  });

  return { product: updatedProduct };
};

export const deleteProduct = async ({ userId, productId }) => {
  // Verificar que el producto existe y pertenece al usuario
  const existingProduct = await Product.findOne({
    where: {
      id: productId,
      user_id: userId
    }
  });

  if (!existingProduct) {
    throw notFound('Producto no encontrado');
  }

  // Soft delete - marcar como inactivo
  await existingProduct.update({ is_active: false });

  return { message: 'Producto eliminado exitosamente' };
};

// Generar código de barras para producto específico
export const generateProductBarcode = async ({ userId, productId }) => {
  // Verificar que el producto pertenezca al usuario
  const product = await Product.findOne({
    where: {
      id: productId,
      user_id: userId
    },
    attributes: ['barcode', 'name']
  });

  if (!product) {
    throw notFound('Producto no encontrado');
  }

  // Generar imagen del código de barras
  const barcodeImage = await generateBarcodeImage(product.barcode);

  return {
    image: barcodeImage,
    barcode: product.barcode,
    format: "CODE128",
    dimensions: {
      width: 400,
      height: 200
    },
    productName: product.name,
    productId: productId
  };
};

// Generar etiqueta de producto con fechas opcionales
export const generateProductLabelWithDates = async ({ userId, productId, dates = {} }) => {
  const { elaborationDate, expirationDate } = dates;

  // Validar fechas si se proporcionan
  if (elaborationDate && !isValidDate(elaborationDate)) {
    throw badRequest('Fecha de elaboración inválida');
  }

  if (expirationDate && !isValidDate(expirationDate)) {
    throw badRequest('Fecha de vencimiento inválida');
  }

  // Obtener producto
  const product = await Product.findOne({
    where: {
      id: productId,
      user_id: userId
    },
    attributes: ['id', 'name', 'price', 'barcode']
  });

  if (!product) {
    throw notFound('Producto no encontrado');
  }

  // Formatear fechas si existen
  const formattedDates = {};
  if (elaborationDate) {
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = elaborationDate.split('-');
    formattedDates.elaborationDate = `${day}/${month}/${year}`;
  }
  if (expirationDate) {
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = expirationDate.split('-');
    formattedDates.expirationDate = `${day}/${month}/${year}`;
  }

  // Crear canvas para la etiqueta
  const canvas = createCanvas(400, 300);
  const ctx = canvas.getContext('2d');

  // Fondo blanco
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 400, 300);

  // Configurar texto
  ctx.fillStyle = '#000000';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';

  // Título del producto
  const maxTitleLength = 35;
  const title = product.name.length > maxTitleLength
    ? product.name.substring(0, maxTitleLength) + '...'
    : product.name;

  ctx.fillText(title, 200, 30);

  // Generar código de barras
  const barcodeCanvas = createCanvas(300, 100);
  JsBarcode(barcodeCanvas, product.barcode, {
    format: "CODE128",
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 12
  });

  // Dibujar código de barras en la etiqueta
  ctx.drawImage(barcodeCanvas, 50, 50);

  // Precio
  if (product.price) {
    ctx.font = '14px Arial';
    ctx.fillText(`Precio: $${parseFloat(product.price).toLocaleString()}`, 200, 180);
  }

  // Fechas opcionales
  let yPosition = 210;
  if (formattedDates.elaborationDate) {
    ctx.fillText(`Elaborado: ${formattedDates.elaborationDate}`, 200, yPosition);
    yPosition += 25;
  }
  if (formattedDates.expirationDate) {
    ctx.fillText(`Vence: ${formattedDates.expirationDate}`, 200, yPosition);
  }

  const labelImage = canvas.toDataURL('image/png');

  return {
    labelImage: labelImage,
    productName: product.name,
    productId: productId,
    dates: formattedDates
  };
};


