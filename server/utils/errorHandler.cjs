/**
 * Standardizirani error response format za API
 */

/**
 * Kreira standardizirani error response
 * @param {string} message - Glavna poruka greške
 * @param {number} statusCode - HTTP status kod
 * @param {Array|Object} details - Dodatni detalji greške (opcionalno)
 * @param {string} code - Error kod za programsku identifikaciju (opcionalno)
 * @returns {Object} Standardizirani error response
 */
function createErrorResponse(message, statusCode = 500, details = null, code = null) {
  const error = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString()
    }
  };

  // Dodaj error kod ako je naveden
  if (code) {
    error.error.code = code;
  }

  // Dodaj detalje ako postoje
  if (details) {
    if (Array.isArray(details)) {
      error.error.details = details;
    } else if (typeof details === 'object') {
      error.error.details = details;
    } else {
      error.error.details = [details];
    }
  }

  return error;
}

/**
 * Kreira success response
 * @param {Object} data - Podaci za vraćanje
 * @param {string} message - Poruka uspjeha (opcionalno)
 * @returns {Object} Standardizirani success response
 */
function createSuccessResponse(data, message = null) {
  const response = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  return response;
}

/**
 * Error kodovi za različite tipove grešaka
 */
const ErrorCodes = {
  // Validacijske greške (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Autentikacijske greške (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  
  // Autorizacijske greške (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Not found greške (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Konflikt greške (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Rate limiting (429)
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // Server greške (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR'
};

/**
 * Helper funkcije za česte error scenarije
 */
const ErrorHelpers = {
  validationError: (details) => {
    return createErrorResponse(
      'Validacijska greška',
      400,
      details,
      ErrorCodes.VALIDATION_ERROR
    );
  },

  unauthorized: (message = 'Neautorizovan pristup') => {
    return createErrorResponse(
      message,
      401,
      null,
      ErrorCodes.UNAUTHORIZED
    );
  },

  forbidden: (message = 'Pristup zabranjen') => {
    return createErrorResponse(
      message,
      403,
      null,
      ErrorCodes.FORBIDDEN
    );
  },

  notFound: (resource = 'Resurs') => {
    return createErrorResponse(
      `${resource} nije pronađen`,
      404,
      null,
      ErrorCodes.NOT_FOUND
    );
  },

  conflict: (message = 'Konflikt podataka') => {
    return createErrorResponse(
      message,
      409,
      null,
      ErrorCodes.CONFLICT
    );
  },

  tooManyRequests: (message = 'Previše zahtjeva') => {
    return createErrorResponse(
      message,
      429,
      null,
      ErrorCodes.TOO_MANY_REQUESTS
    );
  },

  internalError: (message = 'Interna greška servera') => {
    return createErrorResponse(
      message,
      500,
      null,
      ErrorCodes.INTERNAL_ERROR
    );
  }
};

module.exports = {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  ErrorHelpers
};

