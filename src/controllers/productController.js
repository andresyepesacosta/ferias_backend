const Joi = require('joi');
const { pool } = require('../config/database');
const { generateBarcodeImage, generateProductLabel, isValidDate } = require('../services/barcodeService');

// Esquemas de validación
const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow(''),
  manufacturing_cost: Joi.number().min(0).optional().default(0),
  final_price: Joi.number().min(0).optional().default(0),
  stock: Joi.number().integer().min(0).optional().default(0)
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  manufacturing_cost: Joi.number().min(0).optional(),
  final_price: Joi.number().min(0).optional(),
  stock: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional()
});

// Generar código de barras único
const generateBarcodeString = (userId, productId) => {
  // Formato: YYYYMMDD + UserID(3 dígitos) + ProductID(4 dígitos)
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const userPart = userId.toString().padStart(3, '0');
  const productPart = productId.toString().padStart(4, '0');
  return `${date}${userPart}${productPart}`;
};

// Obtener todos los productos del usuario
const getProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [products] = await pool.execute(
      `SELECT 
        id, name, description, image_url, cost as manufacturing_cost, 
        price as final_price, stock, barcode, is_active, created_at, updated_at
       FROM products 
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        products
      }
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener un producto específico
const getProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    const [products] = await pool.execute(
      `SELECT 
        id, name, description, image_url, cost as manufacturing_cost, 
        price as final_price, stock, barcode, is_active, created_at, updated_at
       FROM products 
       WHERE id = ? AND user_id = ?`,
      [productId, userId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        product: products[0]
      }
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo producto
const createProduct = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validar datos de entrada
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { name, description, manufacturing_cost, final_price, stock } = value;

    // Insertar producto
    const [result] = await pool.execute(
      `INSERT INTO products 
       (user_id, name, description, cost, price, stock, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, name, description || null, manufacturing_cost, final_price, stock]
    );

    const productId = result.insertId;

    // Generar código de barras
    const barcode = generateBarcodeString(userId, productId);

    // Actualizar producto con código de barras
    await pool.execute(
      'UPDATE products SET barcode = ? WHERE id = ?',
      [barcode, productId]
    );

    // Obtener el producto creado
    const [newProduct] = await pool.execute(
      `SELECT 
        id, name, description, image_url, cost as manufacturing_cost, 
        price as final_price, stock, barcode, is_active, created_at, updated_at
       FROM products WHERE id = ?`,
      [productId]
    );

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        product: newProduct[0]
      }
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar producto
const updateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    // Validar que el producto pertenezca al usuario
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [productId, userId]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Validar datos de entrada
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Construir consulta de actualización
    const updateFields = [];
    const updateValues = [];
    
    // Mapeo de campos del frontend a la base de datos
    const fieldMapping = {
      'manufacturing_cost': 'cost',
      'final_price': 'price'
    };
    
    Object.keys(value).forEach(key => {
      // Usar el mapeo si existe, sino usar el nombre original
      const dbField = fieldMapping[key] || key;
      updateFields.push(`${dbField} = ?`);
      const fieldValue = value[key] === '' ? null : value[key];
      updateValues.push(fieldValue);
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(productId);

    const updateQuery = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(updateQuery, updateValues);

    // Obtener producto actualizado
    const [updatedProduct] = await pool.execute(
      `SELECT 
        id, name, description, image_url, cost as manufacturing_cost, 
        price as final_price, stock, barcode, is_active, created_at, updated_at
       FROM products WHERE id = ?`,
      [productId]
    );

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        product: updatedProduct[0]
      }
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar producto (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    // Validar que el producto pertenezca al usuario
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [productId, userId]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Soft delete - marcar como inactivo
    await pool.execute(
      'UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [productId]
    );

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar código de barras simple
const generateBarcode = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    // Verificar que el producto pertenezca al usuario
    const [products] = await pool.execute(
      'SELECT barcode, name FROM products WHERE id = ? AND user_id = ?',
      [productId, userId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const product = products[0];
    
    // Generar imagen del código de barras
    const barcodeImage = await generateBarcodeImage(product.barcode);
    
    // Enviar como imagen
    const base64Data = barcodeImage.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="barcode_${product.name.replace(/\s+/g, '_')}.png"`
    });
    
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error al generar código de barras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar etiqueta completa con fechas opcionales
const generateProductLabelWithDates = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const { elaborationDate, expirationDate } = req.body;

    // Validar fechas si se proporcionan
    if (elaborationDate && !isValidDate(elaborationDate)) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de elaboración inválida'
      });
    }

    if (expirationDate && !isValidDate(expirationDate)) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de vencimiento inválida'
      });
    }

    // Obtener producto
    const [products] = await pool.execute(
      'SELECT id, name, price, barcode FROM products WHERE id = ? AND user_id = ?',
      [productId, userId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const product = products[0];
    
    // Formatear fechas si existen
    const dates = {};
    if (elaborationDate) {
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      const [year, month, day] = elaborationDate.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      dates.elaborationDate = `${day}/${month}/${year}`;
      console.log('Fecha de elaboración recibida:', elaborationDate, '-> procesada:', dates.elaborationDate);
    }
    if (expirationDate) {
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      const [year, month, day] = expirationDate.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      dates.expirationDate = `${day}/${month}/${year}`;
      console.log('Fecha de vencimiento recibida:', expirationDate, '-> procesada:', dates.expirationDate);
    }
    
    // Generar etiqueta completa
    const labelImage = await generateProductLabel(product, dates);
    
    // Enviar como imagen
    const base64Data = labelImage.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="etiqueta_${product.name.replace(/\s+/g, '_')}.png"`
    });
    
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error al generar etiqueta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  generateBarcode,
  generateProductLabelWithDates
};
