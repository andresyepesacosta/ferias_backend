import Joi from 'joi';

// Schema para nombre de feria
const nameSchema = Joi.string()
  .min(1)
  .max(255)
  .trim()
  .messages({
    'string.empty': 'El nombre de la feria es requerido',
    'string.min': 'El nombre debe tener al menos 1 caracter',
    'string.max': 'El nombre no puede exceder 255 caracteres',
    'any.required': 'El nombre de la feria es requerido'
  });

// Schema para ubicación
const locationSchema = Joi.string()
  .min(1)
  .max(255)
  .trim()
  .messages({
    'string.empty': 'La ubicación es requerida',
    'string.min': 'La ubicación debe tener al menos 1 caracter',
    'string.max': 'La ubicación no puede exceder 255 caracteres',
    'any.required': 'La ubicación es requerida'
  });

// Schema para fechas
const dateSchema = Joi.date()
  .iso()
  .messages({
    'date.base': 'Debe proporcionar una fecha válida',
    'date.format': 'La fecha debe estar en formato ISO (YYYY-MM-DD)',
    'any.required': 'La fecha es requerida'
  });

// Schema para montos decimales
const decimalSchema = Joi.number()
  .precision(2)
  .min(0)
  .messages({
    'number.base': 'El monto debe ser un número',
    'number.precision': 'El monto no puede tener más de 2 decimales',
    'number.min': 'El monto no puede ser negativo'
  });

// Schema para estado de feria
const statusSchema = Joi.string()
  .valid('upcoming', 'active', 'completed', 'cancelled')
  .messages({
    'any.only': 'El estado debe ser: upcoming, active, completed o cancelled'
  });

// Schema para crear nueva feria
export const createFairSchema = Joi.object({
  name: nameSchema.required(),
  location: locationSchema.required(),
  start_date: dateSchema.required()
    .min('now')
    .messages({
      'date.min': 'La fecha de inicio no puede ser anterior a hoy'
    }),
  end_date: dateSchema.required()
    .greater(Joi.ref('start_date'))
    .messages({
      'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio'
    }),
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'La descripción no puede exceder 1000 caracteres'
    }),
  entry_fee: decimalSchema.allow(null),
  notes: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'Las notas no pueden exceder 1000 caracteres'
    }),
  status: statusSchema.default('upcoming'),
  initial_cash_amount: decimalSchema.default(0)
}).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: name, location, start_date, end_date, description, entry_fee, notes, status, initial_cash_amount'
});

// Schema para actualizar feria existente
export const updateFairSchema = Joi.object({
  name: nameSchema,
  location: locationSchema,
  start_date: dateSchema,
  end_date: dateSchema,
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'La descripción no puede exceder 1000 caracteres'
    }),
  entry_fee: decimalSchema.allow(null),
  notes: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'Las notas no pueden exceder 1000 caracteres'
    }),
  status: statusSchema,
  initial_cash_amount: decimalSchema
}).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permiten: name, location, start_date, end_date, description, entry_fee, notes, status, initial_cash_amount'
});

// Schema para actualizar gastos de feria
export const updateFairExpensesSchema = Joi.object({
  expenses: decimalSchema.required().messages({
    'any.required': 'El monto de gastos es requerido'
  })
}).unknown(false).messages({
  'object.unknown': 'Se están enviando propiedades incorrectas. Solo se permite: expenses'
});