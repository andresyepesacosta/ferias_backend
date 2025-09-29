import Joi from 'joi';

// Schema base para ID de moneda
const currencyIdSchema = Joi.number()
  .integer()
  .positive()
  .messages({
    'number.base': 'El ID de moneda debe ser un número',
    'number.integer': 'El ID de moneda debe ser un número entero',
    'number.positive': 'El ID de moneda debe ser un número positivo',
    'any.required': 'El ID de moneda es requerido'
  });

// Schema para código de moneda
const currencyCodeSchema = Joi.string()
  .min(2)
  .max(10)
  .uppercase()
  .pattern(/^[A-Z]+$/)
  .messages({
    'string.empty': 'El código de moneda es requerido',
    'string.min': 'El código de moneda debe tener al menos 2 caracteres',
    'string.max': 'El código de moneda no puede exceder 10 caracteres',
    'string.pattern.base': 'El código de moneda debe contener solo letras mayúsculas',
    'any.required': 'El código de moneda es requerido'
  });

// Schema para actualizar moneda preferida del usuario
export const updateUserCurrencySchema = Joi.object({
  currencyId: currencyIdSchema.required()
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permite: currencyId'
});

// Schema para validar parámetro de ID de moneda en URL
export const currencyIdParamSchema = Joi.object({
  currencyId: currencyIdSchema.required()
}).unknown(false);

// Schema para validar parámetro de código de moneda en URL
export const currencyCodeParamSchema = Joi.object({
  code: currencyCodeSchema.required()
}).unknown(false);

// Schema para crear nueva moneda (si se implementa en el futuro)
export const createCurrencySchema = Joi.object({
  code: currencyCodeSchema.required(),
  name: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.empty': 'El nombre de la moneda es requerido',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre de la moneda es requerido'
    }),
  symbol: Joi.string()
    .min(1)
    .max(10)
    .messages({
      'string.empty': 'El símbolo de la moneda es requerido',
      'string.min': 'El símbolo debe tener al menos 1 caracter',
      'string.max': 'El símbolo no puede exceder 10 caracteres',
      'any.required': 'El símbolo de la moneda es requerido'
    }),
  decimal_places: Joi.number()
    .integer()
    .min(0)
    .max(8)
    .default(2)
    .messages({
      'number.base': 'Los decimales deben ser un número',
      'number.integer': 'Los decimales deben ser un número entero',
      'number.min': 'Los decimales no pueden ser negativos',
      'number.max': 'Los decimales no pueden exceder 8'
    }),
  is_active: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'El estado activo debe ser verdadero o falso'
    })
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: code, name, symbol, decimal_places, is_active'
});

// Schema para actualizar moneda existente (si se implementa en el futuro)
export const updateCurrencySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres'
    }),
  symbol: Joi.string()
    .min(1)
    .max(10)
    .messages({
      'string.min': 'El símbolo debe tener al menos 1 caracter',
      'string.max': 'El símbolo no puede exceder 10 caracteres'
    }),
  decimal_places: Joi.number()
    .integer()
    .min(0)
    .max(8)
    .messages({
      'number.base': 'Los decimales deben ser un número',
      'number.integer': 'Los decimales deben ser un número entero',
      'number.min': 'Los decimales no pueden ser negativos',
      'number.max': 'Los decimales no pueden exceder 8'
    }),
  is_active: Joi.boolean()
    .messages({
      'boolean.base': 'El estado activo debe ser verdadero o falso'
    })
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: name, symbol, decimal_places, is_active'
});