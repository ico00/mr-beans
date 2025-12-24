import { Component } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Coffee } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Ažuriraj state tako da sljedeći render prikaže fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logiraj grešku u error reporting servis (npr. Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Ovdje možete dodati slanje greške na error tracking servis
    // npr. Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-coffee-cream p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl w-full glass-card rounded-2xl p-8 text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
            </motion.div>
            
            <h1 className="text-3xl font-display font-bold text-coffee-dark mb-4">
              Ups! Nešto je pošlo po zlu
            </h1>
            
            <p className="text-coffee-roast mb-6 text-lg">
              Aplikacija je naišla na neočekivanu grešku. Molimo pokušajte ponovno.
            </p>
            
            {isDevelopment && this.state.error && (
              <motion.details
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-left mb-6 p-4 bg-neutral-100 rounded-lg border border-neutral-300"
              >
                <summary className="cursor-pointer font-semibold text-coffee-dark mb-2 hover:text-coffee-roast transition-colors">
                  Detalji greške (samo u developmentu)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-coffee-dark mb-1">Greška:</p>
                    <pre className="text-xs text-coffee-roast overflow-auto bg-white p-2 rounded border">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-sm font-semibold text-coffee-dark mb-1">Stack trace:</p>
                      <pre className="text-xs text-coffee-roast overflow-auto bg-white p-2 rounded border max-h-48">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReset}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Pokušaj ponovno
              </motion.button>
              
              <Link
                to="/"
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Povratak na početnu
              </Link>
            </div>
            
            <div className="mt-8 pt-6 border-t border-neutral-300">
              <div className="flex items-center justify-center gap-2 text-coffee-roast text-sm">
                <Coffee className="w-4 h-4" />
                <span>Mr. Beans - Praćenje cijena kave</span>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

