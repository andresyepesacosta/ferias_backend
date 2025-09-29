import Joi from 'joi';

// Schema para actualizar perfil de usuario
export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  business_name: Joi.string().max(100).optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  address: Joi.string().max(255).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  country: Joi.string().max(100).optional().allow(''),
  business_type: Joi.string().max(100).optional().allow(''),
  business_description: Joi.string().max(500).optional().allow(''),
  website: Joi.string().uri().optional().allow('')
});

// Schema para actualizar moneda preferida
export const updateUserCurrencySchema = Joi.object({
  preferred_currency_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID de moneda debe ser un número',
      'number.integer': 'El ID de moneda debe ser un número entero',
      'number.positive': 'El ID de moneda debe ser un número positivo',
      'any.required': 'El ID de moneda es requerido'
    })
});
