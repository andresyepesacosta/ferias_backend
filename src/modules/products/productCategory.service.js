
import { notFound, badRequest, internal } from '@hapi/boom';
import ProductCategory from './productCategory.model.js';
import Product from './product.model.js';
import { Op } from 'sequelize';
import sequelize from '../../config/database.config.js';

export const getCategories = async ({ userId }) => {
  try {
    const categories = await ProductCategory.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      attributes: [
        'id',
        'name',
        'description',
        'color',
        'icon',
        'is_active',
        'created_at',
        'updated_at',
        // Agregar conteo de productos por categoría
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM products 
            WHERE products.category_id = ProductCategory.id 
            AND products.is_active = true
          )`),
          'products_count'
        ]
      ],
      order: [['created_at', 'DESC']]
    });

    return { categories };
  } catch (error) {
    console.error('Error in getCategories service:', error);
    throw internal('Error al obtener las categorías del usuario');
  }
};

export const getCategoryById = async ({ userId, categoryId }) => {
  try {
    const category = await ProductCategory.findOne({
      where: {
        id: categoryId,
        user_id: userId
      },
      attributes: [
        'id',
        'name',
        'description',
        'color',
        'icon',
        'is_active',
        'created_at',
        'updated_at',
        // Agregar conteo de productos
        [
          sequelize.fn('COUNT', sequelize.col('products.id')),
          'products_count'
        ]
      ],
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'price', 'stock', 'is_active'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    if (!category) {
      throw notFound('Categoría no encontrada');
    }

    return { category };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error in getCategoryById service:', error);
    throw internal('Error al obtener la categoría');
  }
};

export const createCategory = async ({ userId, categoryData }) => {
  try {
    const { name, description, color, icon } = categoryData;

    // Validaciones básicas
    if (!name || name.trim().length === 0) {
      throw badRequest('El nombre de la categoría es requerido');
    }

    if (name.length > 100) {
      throw badRequest('El nombre de la categoría no puede exceder 100 caracteres');
    }

    // Validar formato de color si se proporciona
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      throw badRequest('El color debe estar en formato hexadecimal válido (#RRGGBB)');
    }

    // Verificar que no exista una categoría con el mismo nombre para este usuario
    const existingCategory = await ProductCategory.findOne({
      where: {
        user_id: userId,
        name: name.trim(),
        is_active: true
      }
    });

    if (existingCategory) {
      throw badRequest('Ya existe una categoría con este nombre');
    }

    // Crear la categoría
    const newCategory = await ProductCategory.create({
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || '#1976d2',
      icon: icon?.trim() || null
    });

    return { category: newCategory };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error in createCategory service:', error);
    throw internal('Error al crear la categoría');
  }
};

export const updateCategory = async ({ userId, categoryId, updateData }) => {
  try {
    // Verificar que la categoría existe y pertenece al usuario
    const existingCategory = await ProductCategory.findOne({
      where: {
        id: categoryId,
        user_id: userId
      }
    });

    if (!existingCategory) {
      throw notFound('Categoría no encontrada');
    }

    const { name, description, color, icon, is_active } = updateData;

    // Validaciones si se actualiza el nombre
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw badRequest('El nombre de la categoría es requerido');
      }

      if (name.length > 100) {
        throw badRequest('El nombre de la categoría no puede exceder 100 caracteres');
      }

      // Verificar que no exista otra categoría con el mismo nombre
      const duplicateCategory = await ProductCategory.findOne({
        where: {
          user_id: userId,
          name: name.trim(),
          is_active: true,
          id: { [Op.ne]: categoryId } // Excluir la categoría actual
        }
      });

      if (duplicateCategory) {
        throw badRequest('Ya existe una categoría con este nombre');
      }
    }

    // Validar formato de color si se proporciona
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      throw badRequest('El color debe estar en formato hexadecimal válido (#RRGGBB)');
    }

    // Construir objeto de actualización
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon?.trim() || null;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      throw badRequest('No se proporcionaron campos para actualizar');
    }

    // Actualizar la categoría
    await existingCategory.update(updates);

    // Obtener la categoría actualizada con conteo de productos
    const updatedCategory = await ProductCategory.findOne({
      where: { id: categoryId },
      attributes: [
        'id',
        'name',
        'description',
        'color',
        'icon',
        'is_active',
        'created_at',
        'updated_at',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM products 
            WHERE products.category_id = ProductCategory.id 
            AND products.is_active = true
          )`),
          'products_count'
        ]
      ]
    });

    return { category: updatedCategory };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error in updateCategory service:', error);
    throw internal('Error al actualizar la categoría');
  }
};

export const deleteCategory = async ({ userId, categoryId }) => {
  try {
    // Verificar que la categoría existe y pertenece al usuario
    const existingCategory = await ProductCategory.findOne({
      where: {
        id: categoryId,
        user_id: userId
      }
    });

    if (!existingCategory) {
      throw notFound('Categoría no encontrada');
    }

    // Verificar si hay productos asociados a esta categoría
    const productsCount = await Product.count({
      where: {
        category_id: categoryId,
        is_active: true
      }
    });

    if (productsCount > 0) {
      throw badRequest(`No se puede eliminar la categoría porque tiene ${productsCount} producto(s) asociado(s). Primero mueva los productos a otra categoría o elimínelos.`);
    }

    // Soft delete - marcar como inactiva
    await existingCategory.update({ is_active: false });

    return { message: 'Categoría eliminada exitosamente' };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error in deleteCategory service:', error);
    throw internal('Error al eliminar la categoría');
  }
};

export const getCategoriesWithStats = async ({ userId }) => {
  try {
    const categories = await ProductCategory.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      attributes: [
        'id',
        'name',
        'description',
        'color',
        'icon',
        'created_at',
        'updated_at',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM products 
            WHERE products.category_id = ProductCategory.id 
            AND products.is_active = true
          )`),
          'products_count'
        ],
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(products.stock), 0)
            FROM products 
            WHERE products.category_id = ProductCategory.id 
            AND products.is_active = true
          )`),
          'total_stock'
        ],
        [
          sequelize.literal(`(
            SELECT COALESCE(AVG(products.price), 0)
            FROM products 
            WHERE products.category_id = ProductCategory.id 
            AND products.is_active = true
          )`),
          'average_price'
        ]
      ],
      order: [['created_at', 'DESC']]
    });

    return { categories };
  } catch (error) {
    console.error('Error in getCategoriesWithStats service:', error);
    throw internal('Error al obtener estadísticas de categorías');
  }
};
