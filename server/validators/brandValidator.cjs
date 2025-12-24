const Joi = require('joi');
const { ErrorHelpers } = require('../utils/errorHandler.cjs');

/**
 * Validacijska shema za brend
 */
const brandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Ime brenda je obavezno',
    'string.min': 'Ime mora imati barem 1 znak',
    'string.max': 'Ime ne može biti duže od 100 znakova',
    'any.required': 'Ime brenda je obavezno'
  }),
  country: Joi.string().trim().max(100).optional().default('Nepoznato').messages({
    'string.max': 'Naziv države ne može biti duži od 100 znakova'
  }),
  founded: Joi.number().integer().min(1000).max(new Date().getFullYear()).optional()
    .default(new Date().getFullYear()).messages({
      'number.base': 'Godina osnutka mora biti broj',
      'number.min': 'Godina osnutka ne može biti manja od 1000',
      'number.max': 'Godina osnutka ne može biti u budućnosti',
      'number.integer': 'Godina osnutka mora biti cijeli broj'
    }),
  logo: Joi.string().allow('').optional()
});

/**
 * Validira podatke brenda
 * @param {Object} data - Podaci za validaciju
 * @returns {{error: null|Object, value: Object}} - Rezultat validacije
 */
function validateBrand(data) {
  const { error, value } = brandSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return {
      error: ErrorHelpers.validationError(details),
      value: null
    };
  }
  
  return { error: null, value };
}

module.exports = {
  validateBrand,
  brandSchema
};

