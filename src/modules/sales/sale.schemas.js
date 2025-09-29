import Joi from 'joi';

// Schema base para ID de feria
const fairIdSchema = Joi.number()
  .integer()
  .positive()
  .messages({
    'number.base': 'El ID de feria debe ser un número',
    'number.integer': 'El ID de feria debe ser un número entero',
    'number.positive': 'El ID de feria debe ser un número positivo',
    'any.required': 'El ID de feria es requerido'
  });

// Schema para item de venta
const saleItemSchema = Joi.object({
  productId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del producto debe ser un número',
      'number.integer': 'El ID del producto debe ser un número entero',
      'number.positive': 'El ID del producto debe ser un número positivo',
      'any.required': 'El ID del producto es requerido'
    }),
  quantity: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'La cantidad debe ser un número',
      'number.positive': 'La cantidad debe ser mayor a 0',
      'any.required': 'La cantidad es requerida'
    }),
  unitPrice: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .messages({
      'number.base': 'El precio unitario debe ser un número',
      'number.min': 'El precio unitario no puede ser negativo',
      'any.required': 'El precio unitario es requerido'
    }),
  discount: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'El descuento debe ser un número',
      'number.min': 'El descuento no puede ser negativo',
      'number.max': 'El descuento no puede ser mayor a 100%'
    }),
  productName: Joi.string()
    .max(255)
    .messages({
      'string.base': 'El nombre del producto debe ser texto',
      'string.max': 'El nombre del producto no puede exceder 255 caracteres'
    })
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: productId, quantity, unitPrice, discount, productName'
});

// Schema para crear una nueva venta
export const createSaleSchema = Joi.object({
  fairId: fairIdSchema.required(),
  items: Joi.array()
    .items(saleItemSchema)
    .min(1)
    .required()
    .messages({
      'array.base': 'Los items deben ser un arreglo',
      'array.min': 'Se requiere al menos un item para la venta',
      'any.required': 'Los items son requeridos'
    }),
  paymentMethod: Joi.string()
    .valid('cash', 'transfer', 'card', 'mixed')
    .required()
    .messages({
      'string.base': 'El método de pago debe ser texto',
      'any.only': 'El método de pago debe ser: cash, transfer, card o mixed',
      'any.required': 'El método de pago es requerido'
    }),
  notes: Joi.string()
    .max(500)
    .allow('', null)
    .messages({
      'string.base': 'Las notas deben ser texto',
      'string.max': 'Las notas no pueden exceder 500 caracteres'
    }),
  customerInfo: Joi.object({
    name: Joi.string()
      .max(255)
      .messages({
        'string.base': 'El nombre del cliente debe ser texto',
        'string.max': 'El nombre del cliente no puede exceder 255 caracteres'
      }),
    phone: Joi.string()
      .pattern(/^[+]?[\d\s\-()]{7,20}$/)
      .messages({
        'string.pattern.base': 'El teléfono debe tener un formato válido'
      }),
    email: Joi.string()
      .email()
      .messages({
        'string.email': 'El email debe tener un formato válido'
      }),
    address: Joi.string()
      .max(500)
      .messages({
        'string.base': 'La dirección debe ser texto',
        'string.max': 'La dirección no puede exceder 500 caracteres'
      })
  }).unknown(false).messages({
    'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: name, phone, email, address'
  }),
  tax: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'El impuesto debe ser un número',
      'number.min': 'El impuesto no puede ser negativo',
      'number.max': 'El impuesto no puede ser mayor a 100%'
    }),
  shippingCost: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'El costo de envío debe ser un número',
      'number.min': 'El costo de envío no puede ser negativo'
    })
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: fairId, items, paymentMethod, notes, customerInfo, tax, shippingCost'
});

// Schema para procesamiento de código de barras
export const processBarcodeSchema = Joi.object({
  imageData: Joi.string()
    .base64()
    .required()
    .messages({
      'string.base': 'Los datos de imagen deben ser texto',
      'string.base64': 'Los datos de imagen deben estar en formato base64',
      'any.required': 'Los datos de imagen son requeridos'
    }),
  format: Joi.string()
    .valid('jpg', 'jpeg', 'png', 'gif', 'webp')
    .default('jpg')
    .messages({
      'string.base': 'El formato debe ser texto',
      'any.only': 'El formato debe ser: jpg, jpeg, png, gif o webp'
    }),
  maxWidth: Joi.number()
    .integer()
    .min(100)
    .max(4000)
    .default(1000)
    .messages({
      'number.base': 'El ancho máximo debe ser un número',
      'number.integer': 'El ancho máximo debe ser un número entero',
      'number.min': 'El ancho máximo debe ser al menos 100px',
      'number.max': 'El ancho máximo no puede exceder 4000px'
    }),
  maxHeight: Joi.number()
    .integer()
    .min(100)
    .max(4000)
    .default(1000)
    .messages({
      'number.base': 'La altura máxima debe ser un número',
      'number.integer': 'La altura máxima debe ser un número entero',
      'number.min': 'La altura máxima debe ser al menos 100px',
      'number.max': 'La altura máxima no puede exceder 4000px'
    })
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: imageData, format, maxWidth, maxHeight'
});