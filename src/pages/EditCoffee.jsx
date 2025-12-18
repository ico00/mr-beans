import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Coffee } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import CoffeeForm from '../components/CoffeeForm';

export default function EditCoffee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { coffees, loading } = useCoffeeData();

  const coffee = coffees.find(c => c.id === id);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Coffee className="w-16 h-16 text-coffee-dark" />
        </motion.div>
      </div>
    );
  }

  if (!coffee) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Coffee className="w-20 h-20 text-neutral-300 mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold text-coffee-dark mb-4">
            Kava nije pronađena
          </h1>
          <p className="text-coffee-roast mb-8">
            Kava koju tražite ne postoji ili je obrisana.
          </p>
          <Link to="/coffees" className="btn-primary">
            Povratak na popis
          </Link>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    navigate(`/coffee/${id}`);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Prepare initial data (strip enriched data)
  const initialData = {
    id: coffee.id,
    name: coffee.name,
    brandId: coffee.brandId,
    type: coffee.type,
    roast: coffee.roast,
    arabicaPercentage: coffee.arabicaPercentage,
    countryIds: coffee.countryIds || (coffee.countryId ? [coffee.countryId] : []),
    storeId: coffee.storeId,
    priceEUR: coffee.priceEUR,
    weightG: coffee.weightG || '',
    rating: coffee.rating,
    image: coffee.image || ''
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
            Uredi kavu
          </h1>
          <p className="text-coffee-roast">
            {coffee.brand?.name} - {coffee.name}
          </p>
        </motion.div>

        {/* Form */}
        <CoffeeForm 
          initialData={initialData} 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  );
}

