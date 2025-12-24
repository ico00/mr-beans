# 💻 Konkretni Primjeri Poboljšanja

Ovaj dokument sadrži konkretne primjere implementacije poboljšanja za aplikaciju Mr. Beans.

---

## 1. 🔐 Sigurnost - Environment Varijable

### Problem
Hardcoded secrets u kodu.

### Rješenje: Kreirati `.env.example` i ažurirati kod

**`.env.example`** (dodati u root projekta):
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_PASSWORD=your-secure-admin-password-change-this

# API URLs
VITE_API_URL=http://localhost:3001/api
```

**`server/auth.cjs`** (ažurirati):
```javascript
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Dodati na vrh

// Environment variables - OBVEZNO u produkciji
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

// Provjeri da li su postavljeni u produkciji
if (process.env.NODE_ENV === 'production') {
  if (!ADMIN_PASSWORD || !JWT_SECRET) {
    throw new Error('ADMIN_PASSWORD i JWT_SECRET moraju biti postavljeni u produkciji!');
  }
  if (JWT_SECRET === 'your-secret-key-change-this-in-production') {
    throw new Error('JWT_SECRET mora biti promijenjen u produkciji!');
  }
}

// Fallback samo za development
const finalAdminPassword = ADMIN_PASSWORD || 'admin123';
const finalJwtSecret = JWT_SECRET || 'dev-secret-key-not-for-production';

function login(password) {
    if (password === finalAdminPassword) {
        const token = jwt.sign(
            { role: 'admin' },
            finalJwtSecret,
            { expiresIn: '7d' }
        );
        return { success: true, token };
    }
    return { success: false, message: 'Pogrešna lozinka' };
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, finalJwtSecret);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// ... ostatak koda
```

**Dodati u `.gitignore`**:
```
.env
.env.local
.env.production
```

---

## 2. 🛡️ Error Boundary Komponenta

### Problem
Nema globalnog error handlinga za React komponente.

### Rješenje: Kreirati Error Boundary

**`src/components/ErrorBoundary.jsx`** (novi fajl):
```jsx
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // Možete poslati error na error tracking servis (npr. Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-coffee-cream p-4">
          <div className="max-w-2xl w-full glass-card rounded-2xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold text-coffee-dark mb-4">
              Ups! Nešto je pošlo po zlu
            </h1>
            <p className="text-coffee-roast mb-6">
              Aplikacija je naišla na neočekivanu grešku. Molimo pokušajte ponovno.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 p-4 bg-neutral-100 rounded-lg">
                <summary className="cursor-pointer font-semibold text-coffee-dark mb-2">
                  Detalji greške (samo u developmentu)
                </summary>
                <pre className="text-xs text-coffee-roast overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-primary inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Pokušaj ponovno
              </button>
              <Link
                to="/"
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Povratak na početnu
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Ažurirati `src/App.jsx`**:
```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CoffeeProvider>
          <AppContent />
        </CoffeeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

---

## 3. ✅ Server-Side Validacija

### Problem
Nema validacije na serveru, moguće slati neispravne podatke.

### Rješenje: Dodati Joi validaciju

**Instalirati:**
```bash
npm install joi
```

**`server/validators/coffeeValidator.cjs`** (novi fajl):
```javascript
const Joi = require('joi');

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
  type: Joi.string().valid('Zrno', 'Nespresso kapsula', 'Mljevena kava').required(),
  roast: Joi.string().valid('Light', 'Medium', 'Dark').required(),
  arabicaPercentage: Joi.number().integer().min(0).max(100).default(100),
  countryIds: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'Odaberite barem jednu državu',
    'any.required': 'Država je obavezna'
  }),
  storeId: Joi.string().required().messages({
    'string.empty': 'Trgovina je obavezna',
    'any.required': 'Trgovina je obavezna'
  }),
  priceEUR: Joi.number().positive().max(10000).required().messages({
    'number.positive': 'Cijena mora biti pozitivna',
    'number.max': 'Cijena ne može biti veća od 10000€',
    'any.required': 'Cijena je obavezna'
  }),
  weightG: Joi.number().positive().max(100000).required().messages({
    'number.positive': 'Težina mora biti pozitivna',
    'number.max': 'Težina ne može biti veća od 100kg',
    'any.required': 'Težina je obavezna'
  }),
  rating: Joi.number().integer().min(1).max(5).default(3),
  image: Joi.string().allow('').optional()
});

const priceEntrySchema = Joi.object({
  date: Joi.date().iso().required().messages({
    'date.base': 'Datum mora biti valjan datum',
    'any.required': 'Datum je obavezan'
  }),
  price: Joi.number().positive().max(10000).required().messages({
    'number.positive': 'Cijena mora biti pozitivna',
    'any.required': 'Cijena je obavezna'
  }),
  storeId: Joi.string().required().messages({
    'any.required': 'Trgovina je obavezna'
  })
});

function validateCoffee(data) {
  const { error, value } = coffeeSchema.validate(data, { abortEarly: false });
  return { error, value };
}

function validatePriceEntry(data) {
  const { error, value } = priceEntrySchema.validate(data, { abortEarly: false });
  return { error, value };
}

module.exports = {
  validateCoffee,
  validatePriceEntry
};
```

**Ažurirati `server/index.cjs`**:
```javascript
const { validateCoffee, validatePriceEntry } = require('./validators/coffeeValidator.cjs');

// Dodaj novu kavu
app.post('/api/coffees', authMiddleware, (req, res) => {
  // Validacija
  const { error, value } = validateCoffee(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validacijska greška', 
      details: error.details.map(d => d.message) 
    });
  }

  const coffeeData = value; // Koristi validirane podatke
  // ... ostatak koda
});

// Dodaj novi unos cijene
app.post('/api/coffees/:id/price', authMiddleware, (req, res) => {
  // Validacija
  const { error, value } = validatePriceEntry(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validacijska greška', 
      details: error.details.map(d => d.message) 
    });
  }

  const { date, price, storeId } = value;
  // ... ostatak koda
});
```

---

## 4. ⚡ Rate Limiting

### Problem
Moguće brute force napade na login endpoint.

### Rješenje: Dodati express-rate-limit

**Instalirati:**
```bash
npm install express-rate-limit
```

**`server/middleware/rateLimiter.cjs`** (novi fajl):
```javascript
const rateLimit = require('express-rate-limit');

// Opći rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 100, // maksimalno 100 zahtjeva po IP-u
  message: 'Previše zahtjeva s ove IP adrese, pokušajte ponovno za 15 minuta.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strog limiter za login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 5, // maksimalno 5 pokušaja prijave
  message: 'Previše pokušaja prijave, pokušajte ponovno za 15 minuta.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne broji uspješne zahtjeve
});

// Limiter za API write operacije
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 10, // maksimalno 10 write operacija po minuti
  message: 'Previše zahtjeva za promjenu podataka, pokušajte ponovno za 1 minutu.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  loginLimiter,
  writeLimiter
};
```

**Ažurirati `server/index.cjs`**:
```javascript
const { generalLimiter, loginLimiter, writeLimiter } = require('./middleware/rateLimiter.cjs');

// Primijeni opći limiter na sve rute
app.use('/api', generalLimiter);

// Strog limiter za login
app.post('/api/auth/login', loginLimiter, (req, res) => {
  // ... postojeći kod
});

// Limiter za write operacije
app.post('/api/coffees', writeLimiter, authMiddleware, (req, res) => {
  // ... postojeći kod
});

app.put('/api/coffees/:id', writeLimiter, authMiddleware, (req, res) => {
  // ... postojeći kod
});

app.delete('/api/coffees/:id', writeLimiter, authMiddleware, (req, res) => {
  // ... postojeći kod
});
```

---

## 5. 🎨 Toast Notifications

### Problem
Loš user feedback za greške i uspjehe.

### Rješenje: Dodati react-hot-toast

**Instalirati:**
```bash
npm install react-hot-toast
```

**Ažurirati `src/main.jsx`**:
```jsx
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#3C2415',
          color: '#F5F0E8',
        },
        success: {
          iconTheme: {
            primary: '#4A7C59',
            secondary: '#F5F0E8',
          },
        },
        error: {
          iconTheme: {
            primary: '#A94442',
            secondary: '#F5F0E8',
          },
        },
      }}
    />
  </StrictMode>,
)
```

**Primjer korištenja u `src/hooks/useCoffeeData.jsx`**:
```jsx
import toast from 'react-hot-toast';

const addCoffee = async (coffee) => {
  try {
    const response = await fetch(`${API_BASE}/coffees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(coffee)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri dodavanju kave');
    }

    const newCoffee = await response.json();
    setCoffees(prev => [...prev, newCoffee]);
    toast.success('Kava uspješno dodana!');
    return newCoffee;
  } catch (err) {
    console.error('Greška pri dodavanju kave:', err);
    toast.error(err.message || 'Greška pri dodavanju kave');
    throw err;
  }
};
```

---

## 6. ⚡ React Query za Caching

### Problem
Nedostaje caching, podaci se učitavaju svaki put.

### Rješenje: Implementirati React Query

**Instalirati:**
```bash
npm install @tanstack/react-query
```

**Ažurirati `src/main.jsx`**:
```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuta
      cacheTime: 10 * 60 * 1000, // 10 minuta
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

**Kreirati `src/hooks/useCoffeesQuery.jsx`**:
```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '../utils/api';

const API_BASE = '/api';

export function useCoffees() {
  return useQuery({
    queryKey: ['coffees'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/coffees`);
      if (!response.ok) throw new Error('Greška pri dohvaćanju kava');
      const data = await response.json();
      return data.coffees || [];
    },
  });
}

export function useAddCoffee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (coffee) => {
      const response = await fetch(`${API_BASE}/coffees`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(coffee)
      });
      if (!response.ok) throw new Error('Greška pri dodavanju kave');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coffees'] });
    },
  });
}
```

---

## 7. 🧪 Unit Test Primjer

### Problem
Nema testova.

### Rješenje: Dodati Jest i React Testing Library

**Instalirati:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

**`jest.config.js`** (novi fajl):
```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
  ],
};
```

**`src/setupTests.js`** (novi fajl):
```javascript
import '@testing-library/jest-dom';
```

**`src/utils/formatters.test.js`** (primjer testa):
```javascript
import { formatPrice, calculatePricePerKg } from './formatters';

describe('formatters', () => {
  describe('formatPrice', () => {
    it('formatira cijenu u EUR', () => {
      expect(formatPrice(10.5)).toBe('10,50 €');
      expect(formatPrice(0)).toBe('0,00 €');
    });
  });

  describe('calculatePricePerKg', () => {
    it('računa cijenu po kilogramu', () => {
      expect(calculatePricePerKg(10, 500)).toBe(20);
      expect(calculatePricePerKg(5, 250)).toBe(20);
    });

    it('vraća null za neispravne inpute', () => {
      expect(calculatePricePerKg(0, 500)).toBeNull();
      expect(calculatePricePerKg(10, 0)).toBeNull();
      expect(calculatePricePerKg(null, 500)).toBeNull();
    });
  });
});
```

**Dodati u `package.json`**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## 📝 Napomene

- Svi primjeri su funkcionalni i mogu se direktno implementirati
- Prilagodite prema svojim potrebama
- Testirajte u development okruženju prije produkcije
- Backup-ajte podatke prije većih promjena

---

*Za više informacija, pogledajte `ANALIZA_I_POBOLJSANJA.md`*

