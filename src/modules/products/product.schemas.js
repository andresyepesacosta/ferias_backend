import Joi from 'joi';

// Schema base para ID de producto
const productIdSchema = Joi.number()
  .integer()
  .positive()
  .messages({
    'number.base': 'El ID de producto debe ser un número',
    'number.integer': 'El ID de producto debe ser un número entero',
    'number.positive': 'El ID de producto debe ser un número positivo',
    'any.required': 'El ID de producto es requerido'
  });

// Schema para ID de categoría (usado en getProductsQuerySchema)
const categoryIdSchema = Joi.number()
  .integer()
  .positive()
  .allow(null)
  .messages({
    'number.base': 'El ID de categoría debe ser un número',
    'number.integer': 'El ID de categoría debe ser un número entero',
    'number.positive': 'El ID de categoría debe ser un número positivo'
  });

// Schema individual para nombre de producto
const productNameSchema = Joi.string()
  .min(1)
  .max(255)
  .trim()
  .messages({
    'string.empty': 'El nombre del producto es requerido',
    'string.min': 'El nombre debe tener al menos 1 caracter',
    'string.max': 'El nombre no puede exceder 255 caracteres',
    'any.required': 'El nombre del producto es requerido'
  });

// Schema individual para descripción
const descriptionSchema = Joi.string()
  .max(1000)
  .allow('', null)
  .messages({
    'string.max': 'La descripción no puede exceder 1000 caracteres'
  });

// Schema individual para costo de manufactura
const manufacturingCostSchema = Joi.number()
  .precision(2)
  .min(0)
  .default(0)
  .messages({
    'number.base': 'El costo de manufactura debe ser un número',
    'number.precision': 'El costo de manufactura no puede tener más de 2 decimales',
    'number.min': 'El costo de manufactura no puede ser negativo'
  });

// Schema individual para precio final
const finalPriceSchema = Joi.number()
  .precision(2)
  .min(0)
  .default(0)
  .messages({
    'number.base': 'El precio final debe ser un número',
    'number.precision': 'El precio final no puede tener más de 2 decimales',
    'number.min': 'El precio final no puede ser negativo'
  });

// Schema individual para stock
const productStockSchema = Joi.number()
  .integer()
  .min(0)
  .default(0)
  .messages({
    'number.base': 'El stock debe ser un número',
    'number.integer': 'El stock debe ser un número entero',
    'number.min': 'El stock no puede ser negativo'
  });

// Schema individual para estado activo
const isActiveSchema = Joi.boolean()
  .messages({
    'boolean.base': 'El estado activo debe ser verdadero o falso'
  });

// Schema para crear producto
export const createProductSchema = Joi.object({
  name: productNameSchema.required(),
  description: descriptionSchema.optional(),
  manufacturing_cost: manufacturingCostSchema.optional(),
  final_price: finalPriceSchema.optional(),
  stock: productStockSchema.optional()
});

// Schema para actualizar producto
export const updateProductSchema = Joi.object({
  name: productNameSchema.optional(),
  description: descriptionSchema.optional(),
  manufacturing_cost: manufacturingCostSchema.optional(),
  final_price: finalPriceSchema.optional(),
  stock: productStockSchema.optional(),
  is_active: isActiveSchema.optional()
});

// Schema para validar parámetro de ID de producto en URL
export const productIdParamSchema = Joi.object({
  id: productIdSchema.required()
}).unknown(false);

// Schema para query parameters de búsqueda de productos
export const getProductsQuerySchema = Joi.object({
  category_id: categoryIdSchema,
  is_active: Joi.boolean()
    .messages({
      'boolean.base': 'El filtro is_active debe ser verdadero o falso'
    }),
  search: Joi.string()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'El término de búsqueda no puede exceder 100 caracteres'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.base': 'El límite debe ser un número',
      'number.integer': 'El límite debe ser un número entero',
      'number.min': 'El límite debe ser al menos 1',
      'number.max': 'El límite no puede exceder 100'
    }),
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'El offset debe ser un número',
      'number.integer': 'El offset debe ser un número entero',
      'number.min': 'El offset no puede ser negativo'
    }),
  sort_by: Joi.string()
    .valid('name', 'price', 'stock', 'created_at', 'updated_at')
    .default('created_at')
    .messages({
      'any.only': 'Solo se puede ordenar por: name, price, stock, created_at, updated_at'
    }),
  sort_order: Joi.string()
    .valid('ASC', 'DESC')
    .default('DESC')
    .messages({
      'any.only': 'El orden debe ser: ASC o DESC'
    })
}).unknown(false);

// Schema para generar etiqueta con fechas
export const generateLabelSchema = Joi.object({
  elaborationDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'La fecha de elaboración debe ser una fecha válida',
      'date.format': 'La fecha de elaboración debe estar en formato ISO (YYYY-MM-DD)'
    }),
  expirationDate: Joi.date()
    .iso()
    .min(Joi.ref('elaborationDate'))
    .optional()
    .messages({
      'date.base': 'La fecha de vencimiento debe ser una fecha válida',
      'date.format': 'La fecha de vencimiento debe estar en formato ISO (YYYY-MM-DD)',
      'date.min': 'La fecha de vencimiento debe ser posterior a la fecha de elaboración'
    })
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: elaborationDate, expirationDate'
});