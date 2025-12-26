const helmet = require('helmet');

const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Helmet konfiguracija za security headers
 * Prilagođeno za React SPA aplikaciju
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Potrebno za inline stilove u React/Vite
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Potrebno za Vite HMR u developmentu
        "'unsafe-eval'" // Potrebno za Vite u developmentu
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:", // Dozvoli slike s bilo kojeg HTTPS izvora
        "http:" // Dozvoli i HTTP za development
      ],
      connectSrc: [
        "'self'",
        "https://query1.finance.yahoo.com", // Za market prices API
        "https://api.investing.com", // Za market prices API (ako se koristi)
        // U developmentu, dozvoli localhost za Vite HMR
        ...(NODE_ENV === 'development' ? ["http://localhost:3001", "ws://localhost:5173"] : [])
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null, // Samo u produkciji
    },
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Onemogućeno jer može uzrokovati probleme s nekim resursima
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: "same-origin" },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: { allow: true },
  
  // Expect-CT
  expectCt: {
    maxAge: 86400, // 24 sata
    enforce: NODE_ENV === 'production'
  },
  
  // Frameguard - sprječava clickjacking
  frameguard: { action: 'deny' },
  
  // Hide Powered-By header
  hidePoweredBy: true,
  
  // HSTS - HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 godina
    includeSubDomains: true,
    preload: false
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff - sprječava MIME type sniffing
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permissions Policy (bivši Feature-Policy)
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'none'"]
    }
  },
  
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  
  // XSS Protection (legacy, ali još uvijek korisno)
  xssFilter: true
});

module.exports = helmetConfig;

