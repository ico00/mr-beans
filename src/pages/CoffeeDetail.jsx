import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Edit, Trash2, MapPin, Store, Calendar, 
  TrendingUp, TrendingDown, Minus, Coffee, Share2, History
} from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { useAuth } from '../context/AuthContext';
import CoffeeBeanRating from '../components/CoffeeBeanRating';
import PriceChart, { PriceByStoreChart } from '../components/PriceChart';
import AddPriceEntry from '../components/AddPriceEntry';
import PriceHistoryTable from '../components/PriceHistoryTable';
import { formatPrice, formatDate, formatWeight, formatPricePerKg, calculatePriceChange, roastLevels, coffeeTypes, IMAGES_FOLDER } from '../utils/formatters';

export default function CoffeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { coffees, deleteCoffee, loading } = useCoffeeData();
  const { isAdmin } = useAuth();

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

  // Uspoređuj cijene samo iz glavnog dućana kave
  const priceChange = calculatePriceChange(coffee.priceHistory, coffee.storeId);
  const roastStyle = roastLevels[coffee.roast];

  const handleDelete = () => {
    if (window.confirm(`Jeste li sigurni da želite obrisati "${coffee.name}"?`)) {
      deleteCoffee(coffee.id);
      navigate('/coffees');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${coffee.brand?.name} - ${coffee.name}`,
          text: `Pogledaj ovu kavu: ${coffee.name} - ${formatPrice(coffee.priceEUR)}`,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link kopiran u međuspremnik!');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-coffee-roast hover:text-coffee-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Natrag
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl hover:bg-coffee-cream/50 text-coffee-roast transition-colors"
              title="Podijeli"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {isAdmin && (
              <>
                <Link
                  to={`/edit/${coffee.id}`}
                  className="p-2 rounded-xl hover:bg-coffee-cream/50 text-coffee-roast transition-colors"
                  title="Uredi"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-xl hover:bg-red-100 text-red-600 transition-colors"
                  title="Obriši"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image & Basic Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Image */}
            <div className="glass-card rounded-2xl overflow-hidden mb-6">
              <div className="aspect-square bg-gradient-to-br from-coffee-light/30 to-coffee-cream flex items-center justify-center p-4">
                {coffee.image ? (
                  <img 
                    src={coffee.image.startsWith('http') ? coffee.image : `${IMAGES_FOLDER}${coffee.image}`}
                    alt={coffee.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-9xl">{coffeeTypes[coffee.type]?.icon || '☕'}</span>
                )}
              </div>
            </div>

            {/* Origin & Store Info */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-display font-bold text-coffee-dark mb-4">
                Informacije
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-coffee-light/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-coffee-dark" />
                  </div>
                  <div>
                    <p className="text-sm text-coffee-roast">
                      {coffee.countries?.length > 1 ? 'Države porijekla' : 'Država porijekla'}
                    </p>
                    {coffee.countries?.length > 0 ? (
                      <div className="space-y-2">
                        {coffee.countries.map(country => (
                          <div key={country.id}>
                            <p className="font-semibold text-coffee-dark flex items-center gap-2">
                              <span className="text-xl">{country.flag}</span>
                              {country.name}
                            </p>
                            {country.coffeeProduction && (
                              <p className="text-sm text-coffee-roast">
                                {country.coffeeProduction}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : coffee.country ? (
                      <div>
                        <p className="font-semibold text-coffee-dark flex items-center gap-2">
                          <span className="text-xl">{coffee.country.flag}</span>
                          {coffee.country.name}
                        </p>
                        {coffee.country.coffeeProduction && (
                          <p className="text-sm text-coffee-roast mt-1">
                            {coffee.country.coffeeProduction}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-coffee-light/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-coffee-dark" />
                  </div>
                  <div>
                    <p className="text-sm text-coffee-roast">Kupljeno u</p>
                    <p className="font-semibold text-coffee-dark">{coffee.store?.name}</p>
                    <p className="text-sm text-coffee-roast">{coffee.store?.type}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-coffee-light/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-coffee-dark" />
                  </div>
                  <div>
                    <p className="text-sm text-coffee-roast">Dodano</p>
                    <p className="font-semibold text-coffee-dark">{formatDate(coffee.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Header Info */}
            <div className="glass-card rounded-2xl p-6">
              <p className="text-coffee-roast mb-1">{coffee.brand?.name}</p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-3">
                {coffee.name}
              </h1>
              
              {/* Type & Roast */}
              <div className="flex items-center gap-4 text-sm mb-4">
                <span className="text-coffee-roast">
                  <span className="font-medium text-coffee-dark">{coffee.type}</span>
                </span>
                <span className="text-neutral-300">|</span>
                <span className="text-coffee-roast">
                  Prženje: <span className="font-medium" style={{ color: roastStyle?.color }}>{coffee.roast}</span>
                </span>
              </div>
              
              {/* Rating */}
              <div className="mb-6">
                <CoffeeBeanRating rating={coffee.rating} readonly size={28} showLabel />
              </div>
              
              {/* Price & Weight */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-coffee-roast mb-1">Trenutna cijena</p>
                  <span className="text-4xl font-bold text-coffee-dark">
                    {formatPrice(coffee.priceEUR)}
                  </span>
                  {coffee.weightG && (
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="px-3 py-1 bg-coffee-cream/50 rounded-lg text-coffee-dark font-medium">
                        {formatWeight(coffee.weightG)}
                      </span>
                      <span className="text-coffee-roast">
                        {formatPricePerKg(coffee.priceEUR, coffee.weightG)}
                      </span>
                    </div>
                  )}
                </div>
                
                {priceChange && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                    priceChange.direction === 'up' ? 'bg-red-100 text-red-600' :
                    priceChange.direction === 'down' ? 'bg-green-100 text-green-600' : 
                    'bg-neutral-100 text-neutral-600'
                  }`}>
                    {priceChange.direction === 'up' && <TrendingUp className="w-5 h-5" />}
                    {priceChange.direction === 'down' && <TrendingDown className="w-5 h-5" />}
                    {priceChange.direction === 'stable' && <Minus className="w-5 h-5" />}
                    <div>
                      <p className="text-sm font-medium">
                        {priceChange.percentage > 0 ? '+' : ''}{priceChange.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs">
                        {priceChange.absolute > 0 ? '+' : ''}{formatPrice(priceChange.absolute)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Arabica/Robusta */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-display font-bold text-coffee-dark mb-4">
                Sastav
              </h3>
              
              <div className="flex justify-between text-sm mb-3">
                <div>
                  <span className="text-coffee-roast">Arabica</span>
                  <p className="text-2xl font-bold text-coffee-dark">{coffee.arabicaPercentage}%</p>
                </div>
                <div className="text-right">
                  <span className="text-coffee-roast">Robusta</span>
                  <p className="text-2xl font-bold text-coffee-dark">{coffee.robustaPercentage}%</p>
                </div>
              </div>
              
              {/* Slider s dvije boje - narančasta (Arabica) i tamno smeđa (Robusta) */}
              <div className="h-4 bg-neutral-200 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ 
                    width: `${coffee.arabicaPercentage}%`,
                    borderRadius: coffee.robustaPercentage === 0 ? '9999px' : '9999px 0 0 9999px'
                  }}
                />
                <div 
                  className="h-full bg-amber-900 transition-all duration-500"
                  style={{ 
                    width: `${coffee.robustaPercentage}%`,
                    borderRadius: coffee.arabicaPercentage === 0 ? '9999px' : '0 9999px 9999px 0'
                  }}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-xs text-coffee-roast">
                <span>Arabica (blago, voćno)</span>
                <span>Robusta (snažno, gorko)</span>
              </div>
            </div>

            {/* Price History Chart */}
            <PriceChart coffee={coffee} />

            {/* Price By Store Chart */}
            <PriceByStoreChart coffee={coffee} />

            {/* Add Price Entry */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-display font-bold text-coffee-dark mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                Povijest cijena po trgovinama
              </h3>
              
              <div className="space-y-6">
                {isAdmin && <AddPriceEntry coffeeId={coffee.id} />}
                
                <PriceHistoryTable 
                  coffeeId={coffee.id} 
                  priceHistory={coffee.priceHistory || []} 
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

