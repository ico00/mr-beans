const cors = require('cors');

// Dobij dozvoljene domene iz environment varijabli
const getAllowedOrigins = () => {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  // U developmentu, dozvoli localhost i sve varijante
  if (NODE_ENV === 'development') {
    return [
      'http://localhost:5173',  // Vite default port
      'http://localhost:3000',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ];
  }
  
  // U produkciji, koristi environment varijable
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  
  if (!allowedOrigins) {
    console.warn('⚠️  ALLOWED_ORIGINS nije postavljen u produkciji! Koristim praznu listu.');
    return [];
  }
  
  // Split po zarezu i trim
  return allowedOrigins
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
};

/**
 * CORS konfiguracija s whitelistom dozvoljenih domena
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    const NODE_ENV = process.env.NODE_ENV || 'development';
    
    // Zahtjevi bez origin-a (npr. Postman, curl, server-to-server, same-origin zahtjevi)
    // Same-origin zahtjevi (frontend i backend na istoj domeni) ne šalju origin header
    if (!origin) {
      // U developmentu dozvoli
      if (NODE_ENV === 'development') {
        return callback(null, true);
      }
      // U produkciji, dozvoli samo ako je to same-origin zahtjev
      // (zahtjevi s iste domene ne šalju origin header)
      // Provjeravamo da li je zahtjev s iste domene gledajući referer ili host header
      // Za sada, dozvoljavamo zahtjeve bez origin-a jer su vjerojatno same-origin
      // (frontend i backend su na mr-beans.fly.dev)
      return callback(null, true);
    }
    
    // Provjeri da li je origin na whitelisti
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS: Blokiran zahtjev s nedozvoljenog origin-a: ${origin}`);
      console.warn(`    Dozvoljeni origin-i: ${allowedOrigins.join(', ')}`);
      callback(new Error('Nije dozvoljeno CORS policy-jem'));
    }
  },
  credentials: true, // Dozvoli slanje cookies i auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset'
  ],
  maxAge: 86400 // 24 sata za preflight cache
};

// Export CORS middleware
const corsMiddleware = cors(corsOptions);

module.exports = {
  corsOptions,
  corsMiddleware,
  getAllowedOrigins
};

