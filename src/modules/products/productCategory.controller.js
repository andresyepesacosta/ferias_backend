import * as productCategoryService from './productCategory.service.js';

export const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { categories } = await productCategoryService.getCategories({ userId });

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const categoryId = req.params.id;

    const { category } = await productCategoryService.getCategoryById({ userId, categoryId });

    res.status(200).json({
      success: true,
      data: {
        category
      }
    });

  } catch (error) {
    if (error.message === 'Categoría no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const categoryData = req.body;

    const { category } = await productCategoryService.createCategory({ userId, categoryData });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        category
      }
    });

  } catch (error) {
    if (error.message.includes('requerido') || 
        error.message.includes('exceder') ||
        error.message.includes('formato hexadecimal') ||
        error.message.includes('Ya existe')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const categoryId = req.params.id;
    const updateData = req.body;

    const { category } = await productCategoryService.updateCategory({ userId, categoryId, updateData });

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: {
        category
      }
    });

  } catch (error) {
    if (error.message === 'Categoría no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('requerido') || 
        error.message.includes('exceder') ||
        error.message.includes('formato hexadecimal') ||
        error.message.includes('Ya existe') ||
        error.message.includes('campos para actualizar')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const categoryId = req.params.id;

    const { message } = await productCategoryService.deleteCategory({ userId, categoryId });

    res.status(200).json({
      success: true,
      message
    });

  } catch (error) {
    if (error.message === 'Categoría no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('producto(s) asociado(s)')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const getCategoriesWithStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { categories } = await productCategoryService.getCategoriesWithStats({ userId });

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    next(error);
  }
};
