import { ProductCategory, Currency, User } from '../../models/index.js';
import Product from './product.model.js';
import { generateBarcodeImage, generateProductLabel, isValidDate } from '../../services/barcodeService.js';

// Generar código de barras único
const generateBarcodeString = (userId, productId) => {
  // Formato: YYYYMMDD + UserID(3 dígitos) + ProductID(4 dígitos)
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const userPart = userId.toString().padStart(3, '0');
  const productPart = productId.toString().padStart(4, '0');
  return `${date}${userPart}${productPart}`;
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
    throw new Error('Error al obtener los productos del usuario');
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
      throw new Error('Producto no encontrado');
    }

    return { product };
  } catch (error) {
    console.error('Error in getProductById service:', error);
    throw error;
  }
};

export const createProduct = async ({ userId, productData }) => {
  try {
    const { 
      name, 
      description, 
      manufacturing_cost, 
      final_price, 
      stock,
      category_id,
      currency_id,
      min_stock,
      sku,
      image_url
    } = productData;

    // Validaciones básicas
    if (!name) {
      throw new Error('El nombre del producto es requerido');
    }

    if (!final_price || final_price < 0) {
      throw new Error('El precio del producto debe ser mayor o igual a 0');
    }

    // Crear el producto
    const newProduct = await Product.create({
      user_id: userId,
      name,
      description: description || null,
      cost: manufacturing_cost || 0,
      price: final_price,
      stock: stock || 0,
      category_id: category_id || null,
      currency_id: currency_id || 1, // Default currency
      min_stock: min_stock || 0,
      sku: sku || null,
      image_url: image_url || null
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
  } catch (error) {
    console.error('Error in createProduct service:', error);
    throw error;
  }
};

export const updateProduct = async ({ userId, productId, updateData }) => {
  try {
    // Verificar que el producto existe y pertenece al usuario
    const existingProduct = await Product.findOne({
      where: {
        id: productId,
        user_id: userId
      }
    });

    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }

    // Mapear campos del frontend a la base de datos
    const fieldMapping = {
      'manufacturing_cost': 'cost',
      'final_price': 'price'
    };

    // Construir objeto de actualización
    const updates = {};
    
    Object.keys(updateData).forEach(key => {
      const dbField = fieldMapping[key] || key;
      const fieldValue = updateData[key] === '' ? null : updateData[key];
      updates[dbField] = fieldValue;
    });

    if (Object.keys(updates).length === 0) {
      throw new Error('No hay campos para actualizar');
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
  } catch (error) {
    console.error('Error in updateProduct service:', error);
    throw error;
  }
};

export const deleteProduct = async ({ userId, productId }) => {
  try {
    // Verificar que el producto existe y pertenece al usuario
    const existingProduct = await Product.findOne({
      where: {
        id: productId,
        user_id: userId
      }
    });

    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }

    // Soft delete - marcar como inactivo
    await existingProduct.update({ is_active: false });

    return { message: 'Producto eliminado exitosamente' };
  } catch (error) {
    console.error('Error in deleteProduct service:', error);
    throw error;
  }
};

export const generateBarcodeForProduct = async ({ userId, productId }) => {
  try {
    // Verificar que el producto pertenece al usuario
    const product = await Product.findOne({
      where: {
        id: productId,
        user_id: userId
      },
      attributes: ['barcode', 'name']
    });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    // Generar imagen del código de barras
    const barcodeImage = await generateBarcodeImage(product.barcode);
    
    return { 
      barcodeImage, 
      productName: product.name,
      barcode: product.barcode 
    };
  } catch (error) {
    console.error('Error in generateBarcodeForProduct service:', error);
    throw error;
  }
};

export const generateProductLabelWithDates = async ({ userId, productId, elaborationDate, expirationDate }) => {
  try {
    // Validar fechas si se proporcionan
    if (elaborationDate && !isValidDate(elaborationDate)) {
      throw new Error('Fecha de elaboración inválida');
    }

    if (expirationDate && !isValidDate(expirationDate)) {
      throw new Error('Fecha de vencimiento inválida');
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
      throw new Error('Producto no encontrado');
    }

    // Formatear fechas si existen
    const dates = {};
    if (elaborationDate) {
      const [year, month, day] = elaborationDate.split('-');
      dates.elaborationDate = `${day}/${month}/${year}`;
    }
    if (expirationDate) {
      const [year, month, day] = expirationDate.split('-');
      dates.expirationDate = `${day}/${month}/${year}`;
    }
    
    // Generar etiqueta completa
    const labelImage = await generateProductLabel(product, dates);
    
    return { 
      labelImage, 
      productName: product.name 
    };
  } catch (error) {
    console.error('Error in generateProductLabelWithDates service:', error);
    throw error;
  }
};
