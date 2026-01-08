import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Home, Table, Grid3X3, Plus, Menu, X, Lock, LockOpen, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin, openLoginModal, logout } = useAuth();

  const navLinks = [
    { path: '/', label: 'Početna', icon: Home },
    { path: '/coffees', label: 'Kave', icon: Coffee },
    { path: '/table', label: 'Tablica', icon: Table },
    { path: '/compare', label: 'Usporedba', icon: ArrowRightLeft },
  ];
  
  const adminNavLinks = [
    { path: '/add', label: 'Dodaj', icon: Plus },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              className="relative"
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Coffee className="w-9 h-9 text-coffee-dark" />
              <motion.div
                className="absolute -top-1 left-1/2 w-1 h-2 bg-coffee-light/60 rounded-full"
                animate={{ y: [-2, -6], opacity: [0.8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <span className="text-xl font-display font-bold text-gradient">Mr. Beans</span>
              <p className="text-[10px] text-coffee-roast -mt-1 hidden sm:block">Praćenje cijena kave</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${isActive(path) 
                    ? 'text-coffee-dark' 
                    : 'text-coffee-roast hover:text-coffee-dark hover:bg-coffee-cream/50'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {isActive(path) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-coffee-light/30 rounded-xl -z-10"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
            {isAdmin && adminNavLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${isActive(path) 
                    ? 'text-coffee-dark' 
                    : 'text-coffee-roast hover:text-coffee-dark hover:bg-coffee-cream/50'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {isActive(path) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-coffee-light/30 rounded-xl -z-10"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
            {/* Admin Button */}
            <button
              onClick={isAdmin ? logout : openLoginModal}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                isAdmin 
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                  : 'text-coffee-roast hover:text-coffee-dark hover:bg-coffee-cream/50'
              }`}
              title={isAdmin ? 'Odjavi se kao admin' : 'Prijavi se kao admin'}
            >
              {isAdmin ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="hidden lg:inline">{isAdmin ? 'Admin' : 'Admin'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-coffee-dark hover:bg-coffee-cream/50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card border-t border-white/20 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                    ${isActive(path)
                      ? 'bg-coffee-light/30 text-coffee-dark'
                      : 'text-coffee-roast hover:bg-coffee-cream/50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              {isAdmin && adminNavLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                    ${isActive(path)
                      ? 'bg-coffee-light/30 text-coffee-dark'
                      : 'text-coffee-roast hover:bg-coffee-cream/50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              {/* Admin Button Mobile */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  isAdmin ? logout() : openLoginModal();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full ${
                  isAdmin 
                    ? 'bg-green-50 text-green-600' 
                    : 'text-coffee-roast hover:bg-coffee-cream/50'
                }`}
              >
                {isAdmin ? <LockOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                <span>{isAdmin ? 'Odjavi se' : 'Admin Login'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

