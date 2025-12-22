import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, TrendingUp, MapPin, Plus, ArrowRight, BarChart3, Star } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import { useAuth } from '../context/AuthContext';
import CoffeeMap from '../components/CoffeeMap';
import CoffeeMarketPrices from '../components/CoffeeMarketPrices';
import { PriceComparisonChart } from '../components/PriceChart';
import { CoffeeBeanRatingSmall } from '../components/CoffeeBeanRating';
import { formatPrice, formatDate, IMAGES_FOLDER, LOGOS_FOLDER } from '../utils/formatters';

export default function Landing() {
  const { coffees, stats, brands, loading, getStoreById } = useCoffeeData();
  const { isAdmin, openLoginModal } = useAuth();
  
  // Na localhostu (development) omogući edit bez logiranja
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
  const canEdit = isDevelopment || isAdmin;
  
  // Sortiraj kave po datumu dodavanja (najnovije prvo)
  const recentCoffees = [...coffees].sort((a, b) => {
    // Prvo pokušaj koristiti createdAt
    if (a.createdAt && b.createdAt) {
      const dateDiff = new Date(b.createdAt) - new Date(a.createdAt);
      // Ako su datumi isti, koristi id (timestamp) za sortiranje
      if (dateDiff === 0) {
        const aId = parseInt(a.id) || 0;
        const bId = parseInt(b.id) || 0;
        return bId - aId;
      }
      return dateDiff;
    }
    // Ako nema createdAt, koristi id (timestamp) za sortiranje
    const aId = parseInt(a.id) || 0;
    const bId = parseInt(b.id) || 0;
    return bId - aId;
  }).slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Coffee className="w-16 h-16 text-coffee-dark" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden py-16 md:py-24" 
        style={{ background: 'linear-gradient(135deg, #3C2415 0%, #6F4E37 50%, #D4A574 100%)' }}
      >
        {/* Coffee bean pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <Coffee 
              key={i}
              className="absolute w-8 h-8 text-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-96 h-96 bg-coffee-light/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-40 -left-20 w-80 h-80 bg-accent-gold/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-6 text-white">
                Pratite cijene kave
                <br />
                kao profesionalac
              </h1>
              
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Unesite, uspoređujte i analizirajte cijene vaših omiljenih kava. 
                Vizualizirajte trendove i nikad više ne propustite dobru ponudu.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/coffees" className="inline-flex items-center justify-center gap-2 bg-white text-coffee-dark px-8 py-4 rounded-xl font-semibold hover:bg-coffee-cream transition-colors text-lg">
                  <Coffee className="w-5 h-5" />
                  Pregledaj kave
                </Link>
                {canEdit ? (
                  <Link to="/add" className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-colors text-lg">
                    <Plus className="w-5 h-5" />
                    Dodaj novu
                  </Link>
                ) : (
                  <button
                    onClick={openLoginModal}
                    className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white/60 border-2 border-white/20 px-8 py-4 rounded-xl font-semibold cursor-not-allowed opacity-50 text-lg"
                    title="Prijavi se kao admin da dodaješ kave"
                  >
                    <Plus className="w-5 h-5" />
                    Dodaj novu
                  </button>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <StatCard 
              icon={Coffee}
              value={stats.totalCoffees}
              label="Ukupno kava"
              delay={0}
            />
            <StatCard 
              icon={TrendingUp}
              value={`${formatPrice(stats.averagePrice)}`}
              label="Prosječna cijena"
              delay={0.1}
            />
            <StatCard 
              icon={Star}
              value={stats.averageRating}
              label="Prosječna ocjena"
              delay={0.2}
            />
            <StatCard 
              icon={MapPin}
              value={Object.keys(stats.byType).length}
              label="Vrste kave"
              delay={0.3}
            />
          </motion.div>
        </div>
      </section>

      {/* Live Market Prices Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-transparent to-coffee-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-4">
              Live tržišne cijene
            </h2>
            <p className="text-coffee-roast max-w-2xl mx-auto">
              Pratite aktualne burzovne cijene arabice i robuste u realnom vremenu.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <CoffeeMarketPrices />
          </motion.div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-4">
              Pojas uzgoja kave
            </h2>
            <p className="text-coffee-roast max-w-2xl mx-auto">
              Istražite zemlje iz kojih dolazi vaša kava. Kliknite na zemlju za više informacija.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <CoffeeMap />
          </motion.div>
        </div>
      </section>

      {/* Price Chart Section */}
      {coffees.length > 1 && (
        <section className="py-12 md:py-20 bg-coffee-cream/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-4">
                Usporedba cijena
              </h2>
              <p className="text-coffee-roast max-w-2xl mx-auto">
                Usporedite kako su se cijene vaših omiljenih kava mijenjale kroz vrijeme.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <PriceComparisonChart coffees={coffees} />
            </motion.div>
          </div>
        </section>
      )}

      {/* Recent Coffees Preview */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-2">
                Nedavno dodane kave
              </h2>
              <p className="text-coffee-roast">
                Najnovije kave u vašoj kolekciji
              </p>
            </div>
            <Link 
              to="/coffees"
              className="hidden sm:flex items-center gap-2 text-coffee-dark font-semibold hover:text-coffee-roast transition-colors"
            >
              Pogledaj sve
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCoffees.length > 0 ? (
              recentCoffees.map((coffee, index) => {
                // Pronađi najnižu cijenu iz priceHistory
                const lowestPriceEntry = coffee.priceHistory && coffee.priceHistory.length > 0
                  ? coffee.priceHistory.reduce((lowest, entry) => 
                      entry.price < lowest.price ? entry : lowest
                    )
                  : null;
                const lowestPriceStore = lowestPriceEntry ? getStoreById(lowestPriceEntry.storeId) : null;
                const displayPrice = lowestPriceEntry ? lowestPriceEntry.price : coffee.priceEUR;
                
                return (
              <motion.div
                key={coffee.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/coffee/${coffee.id}`}>
                  <div className="coffee-card glass-card rounded-2xl p-6 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-24 flex items-center justify-center overflow-hidden">
                        {coffee.image ? (
                          <img 
                            src={coffee.image.startsWith('http') ? coffee.image : `${IMAGES_FOLDER}${coffee.image}`}
                            alt={coffee.name}
                            className="w-full h-auto object-contain"
                          />
                        ) : (
                          <Coffee className="w-8 h-8 text-coffee-dark" />
                        )}
                      </div>
                      <span className="px-3 py-1 bg-coffee-light/30 rounded-full text-xs font-semibold text-coffee-dark">
                        {coffee.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-coffee-roast mb-1">{coffee.brand?.name}</p>
                    <h3 className="text-xl font-display font-bold text-coffee-dark mb-3">
                      {coffee.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {coffee.countries?.length > 0 ? (
                        coffee.countries.map((country, idx) => (
                          <span key={country.id} className="flex items-center gap-1 text-sm text-coffee-roast">
                            <span className="text-lg">{country.flag}</span>
                            <span>{country.name}</span>
                            {idx < coffee.countries.length - 1 && (
                              <span className="text-neutral-300 mx-1">/</span>
                            )}
                          </span>
                        ))
                      ) : coffee.country ? (
                        <>
                          <span className="text-lg">{coffee.country.flag}</span>
                          <span className="text-sm text-coffee-roast">{coffee.country.name}</span>
                        </>
                      ) : null}
                    </div>
                    
                    {/* Težina i dućan s najnižom cijenom */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-coffee-roast">
                      {coffee.weightG && (
                        <span>{coffee.weightG >= 1000 ? `${(coffee.weightG / 1000).toFixed(coffee.weightG % 1000 === 0 ? 0 : 1)}kg` : `${coffee.weightG}g`}</span>
                      )}
                      {lowestPriceStore && lowestPriceEntry && (
                        <span className="font-semibold text-coffee-dark">
                          {lowestPriceStore.name} ({formatDate(lowestPriceEntry.date)})
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                      <span className="text-2xl font-bold text-coffee-dark">
                        {formatPrice(displayPrice)}
                      </span>
                      <CoffeeBeanRatingSmall rating={coffee.rating} />
                    </div>
                  </div>
                </Link>
              </motion.div>
              );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-coffee-roast">
                <p>Nema dodanih kava.</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Link 
              to="/coffees"
              className="btn-secondary inline-flex items-center gap-2"
            >
              Pogledaj sve kave
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-12 md:py-20 bg-coffee-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-coffee-dark mb-4">
              Naši brendovi
            </h2>
            <p className="text-coffee-roast max-w-2xl mx-auto">
              Pratimo cijene kava od vodećih proizvođača kave diljem svijeta.
            </p>
          </div>
          
          <div className="border-t border-neutral-300 pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {brands && Array.isArray(brands) && brands.length > 0 ? brands.map((brand, index) => (
                  <motion.div
                    key={brand.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex items-center justify-center"
                  >
                    {brand.logo ? (
                      <img
                        src={`${LOGOS_FOLDER}${brand.logo}`}
                        alt={brand.name}
                        className="h-12 md:h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`hidden items-center justify-center h-12 md:h-16 ${brand.logo ? '' : 'flex'}`}
                      style={{ display: brand.logo ? 'none' : 'flex' }}
                    >
                      <span className="text-2xl md:text-3xl font-display font-bold text-coffee-dark opacity-60">
                        {brand.name}
                      </span>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-2 md:col-span-4 text-center text-coffee-roast py-8">
                    Nema dostupnih brandova
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      {/* Footer */}
      <footer className="py-8 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coffee className="w-5 h-5 text-coffee-dark" />
            <span className="font-display font-bold text-coffee-dark">Mr. Beans</span>
          </div>
          <p className="text-sm text-coffee-roast">
            Praćenje cijena kave © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + delay }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/30"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 bg-coffee-light/30 rounded-xl mb-3">
        <Icon className="w-6 h-6 text-coffee-dark" />
      </div>
      <p className="text-2xl md:text-3xl font-bold text-coffee-dark mb-1">{value}</p>
      <p className="text-sm text-coffee-roast">{label}</p>
    </motion.div>
  );
}

