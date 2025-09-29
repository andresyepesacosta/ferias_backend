import Joi from 'joi';

const nameSchema = Joi.string()
  .min(2)
  .max(100)
  .messages({
    'string.empty': 'El nombre es requerido',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres',
    'any.required': 'El nombre es requerido'
  });

const emailSchema = Joi.string()
  .email()
  .messages({
    'string.empty': 'El email es requerido',
    'string.email': 'Debe proporcionar un email válido',
    'any.required': 'El email es requerido'
  });

const passwordSchema = Joi.string()
  .min(6)
  .messages({
    'string.empty': 'La contraseña es requerida',
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  });

const preferredCurrencyIdSchema = Joi.number()
  .integer()
  .positive()
  .messages({
    'number.base': 'El ID de moneda preferida debe ser un número',
    'number.integer': 'El ID de moneda preferida debe ser un número entero',
    'number.positive': 'El ID de moneda preferida debe ser un número positivo'
  });


export const authLoginSchema = Joi.object({
  email: emailSchema.required(),
  password: passwordSchema.required()
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: email, password'
});

export const authRegisterSchema = Joi.object({
  name: nameSchema.required(),
  email: emailSchema.required(),
  password: passwordSchema.required(),
  preferred_currency_id: preferredCurrencyIdSchema.optional()
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: name, email, password, preferred_currency_id'
});
