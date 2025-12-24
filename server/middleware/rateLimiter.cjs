const rateLimit = require('express-rate-limit');

/**
 * Opći rate limiter za sve API zahtjeve
 * 100 zahtjeva po 15 minuta po IP adresi
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 100, // maksimalno 100 zahtjeva po IP-u
  message: {
    error: 'Previše zahtjeva',
    message: 'Previše zahtjeva s ove IP adrese, pokušajte ponovno za 15 minuta.'
  },
  standardHeaders: true, // Vraća rate limit info u `RateLimit-*` headers
  legacyHeaders: false, // Ne koristi `X-RateLimit-*` headers
});

/**
 * Strog limiter za login endpoint
 * 5 pokušaja prijave po 15 minuta po IP adresi
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 5, // maksimalno 5 pokušaja prijave
  message: {
    error: 'Previše pokušaja prijave',
    message: 'Previše pokušaja prijave, pokušajte ponovno za 15 minuta.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne broji uspješne zahtjeve (samo neuspješne pokušaje)
  skipFailedRequests: false, // Broji neuspješne pokušaje
});

/**
 * Limiter za write operacije (POST, PUT, DELETE)
 * 10 operacija po minuti po IP adresi
 */
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 10, // maksimalno 10 write operacija po minuti
  message: {
    error: 'Previše zahtjeva',
    message: 'Previše zahtjeva za promjenu podataka, pokušajte ponovno za 1 minutu.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter za upload operacije (slike)
 * 5 uploada po 10 minuta po IP adresi
 */
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minuta
  max: 5, // maksimalno 5 uploada po 10 minuta
  message: {
    error: 'Previše uploada',
    message: 'Previše uploada slika, pokušajte ponovno za 10 minuta.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  loginLimiter,
  writeLimiter,
  uploadLimiter
};

