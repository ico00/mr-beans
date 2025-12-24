const Joi = require('joi');
const { ErrorHelpers } = require('../utils/errorHandler.cjs');

/**
 * Validacijska shema za državu
 */
const countrySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Ime države je obavezno',
    'string.min': 'Ime mora imati barem 1 znak',
    'string.max': 'Ime ne može biti duže od 100 znakova',
    'any.required': 'Ime države je obavezno'
  }),
  flag: Joi.string().trim().max(10).optional().default('🌍').messages({
    'string.max': 'Flag emoji ne može biti duži od 10 znakova'
  }),
  region: Joi.string().trim().max(100).optional().default('Nepoznato').messages({
    'string.max': 'Regija ne može biti duža od 100 znakova'
  }),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required().messages({
      'number.base': 'Latituda mora biti broj',
      'number.min': 'Latituda mora biti između -90 i 90',
      'number.max': 'Latituda mora biti između -90 i 90',
      'any.required': 'Latituda je obavezna'
    }),
    lng: Joi.number().min(-180).max(180).required().messages({
      'number.base': 'Longituda mora biti broj',
      'number.min': 'Longituda mora biti između -180 i 180',
      'number.max': 'Longituda mora biti između -180 i 180',
      'any.required': 'Longituda je obavezna'
    })
  }).optional().default({ lat: 0, lng: 0 }),
  coffeeProduction: Joi.string().trim().max(500).optional().allow('').messages({
    'string.max': 'Opis proizvodnje ne može biti duži od 500 znakova'
  }),
  varieties: Joi.array().items(Joi.string()).optional().default([]).messages({
    'array.base': 'Varijete moraju biti niz'
  })
});

/**
 * Validira podatke države
 * @param {Object} data - Podaci za validaciju
 * @returns {{error: null|Object, value: Object}} - Rezultat validacije
 */
function validateCountry(data) {
  const { error, value } = countrySchema.validate(data, { 
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
  validateCountry,
  countrySchema
};

