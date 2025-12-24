const Joi = require('joi');
const { ErrorHelpers } = require('../utils/errorHandler.cjs');

/**
 * Validacijska shema za kavu
 */
const coffeeSchema = Joi.object({
  brandId: Joi.string().required().messages({
    'string.empty': 'Brend je obavezan',
    'any.required': 'Brend je obavezan'
  }),
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Ime kave je obavezno',
    'string.min': 'Ime mora imati barem 1 znak',
    'string.max': 'Ime ne može biti duže od 200 znakova',
    'any.required': 'Ime kave je obavezno'
  }),
  type: Joi.string().valid('Zrno', 'Nespresso kapsula', 'Mljevena kava').required().messages({
    'any.only': 'Tip mora biti: Zrno, Nespresso kapsula ili Mljevena kava',
    'any.required': 'Tip kave je obavezan'
  }),
  roast: Joi.string().valid('Light', 'Medium', 'Dark').required().messages({
    'any.only': 'Razina prženja mora biti: Light, Medium ili Dark',
    'any.required': 'Razina prženja je obavezna'
  }),
  arabicaPercentage: Joi.number().integer().min(0).max(100).default(100).messages({
    'number.base': 'Postotak arabice mora biti broj',
    'number.min': 'Postotak arabice ne može biti manji od 0',
    'number.max': 'Postotak arabice ne može biti veći od 100',
    'number.integer': 'Postotak arabice mora biti cijeli broj'
  }),
  countryIds: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.base': 'Države moraju biti niz',
    'array.min': 'Odaberite barem jednu državu',
    'any.required': 'Država je obavezna'
  }),
  storeId: Joi.string().required().messages({
    'string.empty': 'Trgovina je obavezna',
    'any.required': 'Trgovina je obavezna'
  }),
  priceEUR: Joi.number().positive().max(10000).required().messages({
    'number.base': 'Cijena mora biti broj',
    'number.positive': 'Cijena mora biti pozitivna',
    'number.max': 'Cijena ne može biti veća od 10000€',
    'any.required': 'Cijena je obavezna'
  }),
  weightG: Joi.number().positive().max(100000).required().messages({
    'number.base': 'Težina mora biti broj',
    'number.positive': 'Težina mora biti pozitivna',
    'number.max': 'Težina ne može biti veća od 100kg (100000g)',
    'any.required': 'Težina je obavezna'
  }),
  rating: Joi.number().integer().min(1).max(5).default(3).messages({
    'number.base': 'Ocjena mora biti broj',
    'number.min': 'Ocjena mora biti barem 1',
    'number.max': 'Ocjena ne može biti veća od 5',
    'number.integer': 'Ocjena mora biti cijeli broj'
  }),
  image: Joi.string().allow('').optional()
});

/**
 * Validacijska shema za unos cijene
 */
const priceEntrySchema = Joi.object({
  date: Joi.date().iso().required().messages({
    'date.base': 'Datum mora biti valjan datum',
    'date.format': 'Datum mora biti u ISO formatu (YYYY-MM-DD)',
    'any.required': 'Datum je obavezan'
  }),
  price: Joi.number().positive().max(10000).required().messages({
    'number.base': 'Cijena mora biti broj',
    'number.positive': 'Cijena mora biti pozitivna',
    'number.max': 'Cijena ne može biti veća od 10000€',
    'any.required': 'Cijena je obavezna'
  }),
  storeId: Joi.string().required().messages({
    'string.empty': 'Trgovina je obavezna',
    'any.required': 'Trgovina je obavezna'
  })
});

/**
 * Validira podatke kave
 * @param {Object} data - Podaci za validaciju
 * @param {Object} options - Opcije validacije (npr. { partial: true } za update)
 * @returns {{error: null|Object, value: Object}} - Rezultat validacije
 */
function validateCoffee(data, options = {}) {
  // Za update operacije, sva polja su opcionalna, ali ako su poslana, moraju biti validna
  const schema = options.partial 
    ? Joi.object({
        brandId: Joi.string().optional(),
        name: Joi.string().trim().min(1).max(200).optional(),
        type: Joi.string().valid('Zrno', 'Nespresso kapsula', 'Mljevena kava').optional(),
        roast: Joi.string().valid('Light', 'Medium', 'Dark').optional(),
        arabicaPercentage: Joi.number().integer().min(0).max(100).optional(),
        countryIds: Joi.array().items(Joi.string()).min(1).optional(),
        storeId: Joi.string().optional(),
        priceEUR: Joi.number().positive().max(10000).optional(),
        weightG: Joi.number().positive().max(100000).optional(),
        rating: Joi.number().integer().min(1).max(5).optional(),
        image: Joi.string().allow('').optional()
      })
    : coffeeSchema;
  
  const { error, value } = schema.validate(data, { 
    abortEarly: false, // Vrati sve greške, ne samo prvu
    stripUnknown: true // Ukloni nepoznata polja
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

/**
 * Validira unos cijene
 * @param {Object} data - Podaci za validaciju
 * @returns {{error: null|Object, value: Object}} - Rezultat validacije
 */
function validatePriceEntry(data) {
  const { error, value } = priceEntrySchema.validate(data, { 
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
  validateCoffee,
  validatePriceEntry,
  coffeeSchema,
  priceEntrySchema
};

