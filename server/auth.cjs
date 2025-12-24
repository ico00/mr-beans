const jwt = require('jsonwebtoken');
require('dotenv').config();
const { ErrorHelpers } = require('./utils/errorHandler.cjs');

// Environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Provjeri da li su postavljeni u produkciji
if (NODE_ENV === 'production') {
  if (!ADMIN_PASSWORD || !JWT_SECRET) {
    console.error('❌ KRITIČNA GREŠKA: ADMIN_PASSWORD i JWT_SECRET moraju biti postavljeni u produkciji!');
    throw new Error('ADMIN_PASSWORD i JWT_SECRET moraju biti postavljeni u produkciji!');
  }
  if (JWT_SECRET === 'your-secret-key-change-this-in-production' || 
      JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    console.error('❌ KRITIČNA GREŠKA: JWT_SECRET mora biti promijenjen u produkciji!');
    throw new Error('JWT_SECRET mora biti promijenjen u produkciji!');
  }
  if (ADMIN_PASSWORD === 'admin123' || ADMIN_PASSWORD === 'your-secure-admin-password-change-this') {
    console.error('❌ KRITIČNA GREŠKA: ADMIN_PASSWORD mora biti promijenjen u produkciji!');
    throw new Error('ADMIN_PASSWORD mora biti promijenjen u produkciji!');
  }
}

// Fallback samo za development
const finalAdminPassword = ADMIN_PASSWORD || 'admin123';
const finalJwtSecret = JWT_SECRET || 'dev-secret-key-not-for-production';

if (NODE_ENV === 'development') {
  console.log('⚠️  Development mode: koriste se default vrijednosti za sigurnost');
  console.log('⚠️  U produkciji, postavite ADMIN_PASSWORD i JWT_SECRET u .env fajlu!');
}

/**
 * Proverava admin lozinku i vraća JWT token
 */
function login(password) {
    if (password === finalAdminPassword) {
        // Kreiraj JWT token koji ističe za 7 dana
        const token = jwt.sign(
            { role: 'admin' },
            finalJwtSecret,
            { expiresIn: '7d' }
        );
        return { success: true, token };
    }
    return { success: false, message: 'Pogrešna lozinka' };
}

/**
 * Proverava validnost JWT tokena
 */
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, finalJwtSecret);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * Express middleware za zaštitu ruta
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json(ErrorHelpers.unauthorized('Token nije prosleđen'));
    }

    const token = authHeader.substring(7); // Ukloni "Bearer "
    const result = verifyToken(token);

    if (!result.valid) {
        return res.status(401).json(ErrorHelpers.unauthorized('Nevažeći token'));
    }

    req.user = result.decoded;
    next();
}

module.exports = {
    login,
    verifyToken,
    authMiddleware
};

