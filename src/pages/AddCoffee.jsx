import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CoffeeForm from '../components/CoffeeForm';

export default function AddCoffee() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <ArrowLeft className="w-16 h-16 text-coffee-dark" />
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleSuccess = () => {
    navigate('/coffees');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-coffee-roast hover:text-coffee-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Natrag
        </motion.button>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-2">
            Dodaj novu kavu
          </h1>
          <p className="text-coffee-roast">
            Unesite informacije o novoj kavi koju želite pratiti
          </p>
        </motion.div>

        {/* Form */}
        <CoffeeForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}

