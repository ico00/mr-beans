import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, Euro, Store, Save } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';

export default function AddPriceEntry({ coffeeId, onSuccess, onCancel }) {
  const { stores, addPriceEntry } = useCoffeeData();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    price: '',
    storeId: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.price || !formData.storeId) {
      alert('Molimo popunite sva polja');
      return;
    }

    setLoading(true);
    try {
      await addPriceEntry(coffeeId, {
        date: formData.date,
        price: parseFloat(formData.price),
        storeId: formData.storeId
      });
      
      // Reset forme
      setFormData({
        date: new Date().toISOString().split('T')[0],
        price: '',
        storeId: ''
      });
      setIsOpen(false);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Greška pri dodavanju cijene:', error);
      alert('Greška pri spremanju cijene');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-coffee-dark to-coffee-roast text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
      >
        <Plus className="w-5 h-5" />
        Dodaj novu cijenu
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="glass-card rounded-2xl p-6 border-2 border-coffee-light/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold text-coffee-dark flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Nova cijena
            </h3>
            <button
              onClick={() => {
                setIsOpen(false);
                if (onCancel) onCancel();
              }}
              className="p-2 rounded-lg hover:bg-coffee-cream/50 transition-colors"
            >
              <X className="w-5 h-5 text-coffee-roast" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Datum */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-coffee-dark mb-2">
                <Calendar className="w-4 h-4" />
                Datum
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-coffee-light focus:border-coffee-light transition-all"
                required
              />
            </div>

            {/* Trgovina */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-coffee-dark mb-2">
                <Store className="w-4 h-4" />
                Trgovina
              </label>
              <select
                name="storeId"
                value={formData.storeId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-coffee-light focus:border-coffee-light transition-all"
                required
              >
                <option value="">Odaberi trgovinu</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cijena */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-coffee-dark mb-2">
                <Euro className="w-4 h-4" />
                Cijena (EUR)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0,00"
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-coffee-light focus:border-coffee-light transition-all"
                required
              />
            </div>

            {/* Gumbi */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onCancel) onCancel();
                }}
                className="flex-1 px-4 py-3 bg-neutral-100 text-coffee-roast rounded-xl font-medium hover:bg-neutral-200 transition-colors"
              >
                Odustani
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-coffee-dark to-coffee-roast text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Spremi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

