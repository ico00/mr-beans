const Joi = require('joi');
const { ErrorHelpers } = require('../utils/errorHandler.cjs');

/**
 * Validacijska shema za trgovinu
 */
const storeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Ime trgovine je obavezno',
    'string.min': 'Ime mora imati barem 1 znak',
    'string.max': 'Ime ne može biti duže od 200 znakova',
    'any.required': 'Ime trgovine je obavezno'
  }),
  type: Joi.string().trim().max(50).optional().default('Trgovina').messages({
    'string.max': 'Tip trgovine ne može biti duži od 50 znakova'
  }),
  website: Joi.string().uri().allow('').optional().messages({
    'string.uri': 'Website mora biti valjan URL'
  })
});

/**
 * Validira podatke trgovine
 * @param {Object} data - Podaci za validaciju
 * @returns {{error: null|Object, value: Object}} - Rezultat validacije
 */
function validateStore(data) {
  const { error, value } = storeSchema.validate(data, { 
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
  validateStore,
  storeSchema
};

