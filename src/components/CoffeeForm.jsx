import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, X, Upload, Image, Check, Loader2 } from 'lucide-react';
import { useCoffeeData } from '../hooks/useCoffeeData';
import CoffeeBeanRating from './CoffeeBeanRating';

// Konstanta za folder sa slikama
const IMAGES_FOLDER = '/images/coffees/';
const LOGOS_FOLDER = '/images/brands/';

// Helper za upload slike
const uploadImage = async (file, type = 'coffee') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch(`/api/upload/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            data: reader.result,
            mimeType: file.type
          })
        });
        
        if (!response.ok) {
          throw new Error('Upload nije uspio');
        }
        
        const result = await response.json();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Greška pri čitanju datoteke'));
    reader.readAsDataURL(file);
  });
};

export default function CoffeeForm({ initialData = null, onSuccess, onCancel }) {
  const { brands, stores, countries, addCoffee, updateCoffee, addBrand, updateBrand, addStore, addCountry } = useCoffeeData();
  
  const [formData, setFormData] = useState({
    brandId: initialData?.brandId || '',
    name: initialData?.name || '',
    type: initialData?.type || 'Zrno',
    roast: initialData?.roast || 'Medium',
    arabicaPercentage: initialData?.arabicaPercentage ?? 100,
    countryIds: initialData?.countryIds || (initialData?.countryId ? [initialData.countryId] : []),
    storeId: initialData?.storeId || '',
    priceEUR: initialData?.priceEUR || '',
    rating: initialData?.rating || 3,
    image: initialData?.image || ''
  });
  
  const [newBrand, setNewBrand] = useState({ name: '', logo: '' });
  const [newStore, setNewStore] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [showNewStore, setShowNewStore] = useState(false);
  const [showNewCountry, setShowNewCountry] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageInputType, setImageInputType] = useState('upload'); // 'filename' ili 'upload'
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const imageInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const coffeeTypes = ['Zrno', 'Nespresso kapsula', 'Mljevena kava'];
  const roastTypes = ['Blonde', 'Medium', 'Dark'];
  const arabicaSteps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Toggle country selection (multi-select)
  const toggleCountry = (countryId) => {
    setFormData(prev => {
      const currentIds = prev.countryIds || [];
      const newIds = currentIds.includes(countryId)
        ? currentIds.filter(id => id !== countryId)
        : [...currentIds, countryId];
      return { ...prev, countryIds: newIds };
    });
    
    if (errors.countryIds) {
      setErrors(prev => ({ ...prev, countryIds: null }));
    }
  };

  const handleAddBrand = () => {
    if (newBrand.name.trim()) {
      const brand = addBrand(newBrand.name.trim(), newBrand.logo);
      setFormData(prev => ({ ...prev, brandId: brand.id }));
      setNewBrand({ name: '', logo: '' });
      setShowNewBrand(false);
    }
  };

  const handleAddStore = () => {
    if (newStore.trim()) {
      const store = addStore(newStore.trim());
      setFormData(prev => ({ ...prev, storeId: store.id }));
      setNewStore('');
      setShowNewStore(false);
    }
  };

  const handleAddCountry = () => {
    if (newCountry.trim()) {
      const country = addCountry(newCountry.trim());
      setFormData(prev => ({ 
        ...prev, 
        countryIds: [...(prev.countryIds || []), country.id] 
      }));
      setNewCountry('');
      setShowNewCountry(false);
    }
  };

  // Handle image file selection with actual upload
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Provjeri veličinu (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Datoteka je prevelika (max 5MB)' }));
      return;
    }
    
    // Prikaži preview odmah
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    
    // Upload na server
    setUploading(true);
    try {
      const result = await uploadImage(file, 'coffee');
      setFormData(prev => ({ ...prev, image: result.filename }));
      setErrors(prev => ({ ...prev, image: null }));
      // Očisti base64 preview nakon uspješnog uploada - koristi sliku sa servera
      setImagePreview(null);
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => ({ ...prev, image: 'Greška pri uploadu slike' }));
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Handle logo file selection for new brand with actual upload
  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Provjeri veličinu (max 2MB za logo)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo je prevelik (max 2MB)');
      return;
    }
    
    // Prikaži preview odmah
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    
    // Upload na server
    setUploadingLogo(true);
    try {
      const result = await uploadImage(file, 'brand');
      setNewBrand(prev => ({ ...prev, logo: result.filename }));
      // Očisti base64 preview nakon uspješnog uploada - koristi sliku sa servera
      setLogoPreview(null);
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Greška pri uploadu loga');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.brandId) newErrors.brandId = 'Odaberite brend';
    if (!formData.name.trim()) newErrors.name = 'Ime je obavezno';
    if (!formData.countryIds || formData.countryIds.length === 0) {
      newErrors.countryIds = 'Odaberite barem jednu državu';
    }
    if (!formData.storeId) newErrors.storeId = 'Odaberite trgovinu';
    if (!formData.priceEUR || formData.priceEUR <= 0) newErrors.priceEUR = 'Unesite ispravnu cijenu';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const coffeeData = {
      ...formData,
      priceEUR: Number(formData.priceEUR),
      arabicaPercentage: Number(formData.arabicaPercentage),
      robustaPercentage: 100 - Number(formData.arabicaPercentage)
    };
    
    if (initialData) {
      updateCoffee(initialData.id, coffeeData);
    } else {
      addCoffee(coffeeData);
    }
    
    onSuccess?.();
  };

  const robustaPercentage = 100 - (Number(formData.arabicaPercentage) || 0);
  const selectedBrand = brands.find(b => b.id === formData.brandId);

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl p-6 md:p-8 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-display font-bold text-coffee-dark mb-6">
        {initialData ? 'Uredi kavu' : 'Dodaj novu kavu'}
      </h2>
      
      <div className="space-y-6">
        {/* 1. BRAND (FIRST) */}
        <div>
          <label className="form-label">Brend *</label>
          {showNewBrand ? (
            <div className="space-y-3 p-4 bg-coffee-cream/30 rounded-xl">
              <input
                type="text"
                value={newBrand.name}
                onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                className="form-input"
                placeholder="Naziv novog brenda"
                autoFocus
              />
              
              {/* Logo upload for new brand */}
              <div>
                <label className="form-label text-sm">Logo brenda (opcionalno)</label>
                <div 
                  onClick={() => !uploadingLogo && logoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    uploadingLogo 
                      ? 'border-coffee-roast bg-coffee-cream/30 cursor-wait' 
                      : 'border-neutral-300 cursor-pointer hover:border-coffee-roast hover:bg-coffee-cream/20'
                  }`}
                >
                  {uploadingLogo ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-coffee-roast animate-spin" />
                      <span className="text-coffee-dark text-sm">Uploadam logo...</span>
                    </div>
                  ) : logoPreview || newBrand.logo ? (
                    <div className="flex items-center justify-center gap-3">
                      <img 
                        src={logoPreview || `${LOGOS_FOLDER}${newBrand.logo}`}
                        alt="Logo preview"
                        className="w-12 h-12 object-contain rounded-lg bg-white p-1"
                      />
                      <div className="text-left">
                        <span className="text-coffee-dark font-medium text-sm block">{newBrand.logo || 'Novi logo'}</span>
                        <span className="text-xs text-coffee-roast">Klikni za promjenu</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5 text-neutral-400" />
                      <span className="text-coffee-roast text-sm">Klikni za upload loga</span>
                    </div>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleLogoSelect}
                  className="hidden"
                  disabled={uploadingLogo}
                />
                <p className="text-xs text-coffee-roast mt-1">
                  PNG, JPG, SVG do 2MB • Spremit će se u {LOGOS_FOLDER}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button type="button" onClick={handleAddBrand} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Dodaj brend
                </button>
                <button type="button" onClick={() => setShowNewBrand(false)} className="btn-secondary px-4">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={formData.brandId}
                  onChange={(e) => handleChange('brandId', e.target.value)}
                  className={`form-input ${errors.brandId ? 'border-error' : ''}`}
                >
                  <option value="">Odaberi brend</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => setShowNewBrand(true)}
                  className="btn-secondary px-4 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {/* Show selected brand with logo */}
              {selectedBrand && (
                <div className="flex items-center gap-3 p-3 bg-coffee-cream/30 rounded-xl">
                  {selectedBrand.logo ? (
                    <img 
                      src={`${LOGOS_FOLDER}${selectedBrand.logo}`} 
                      alt={selectedBrand.name}
                      className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-coffee-light/30 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-coffee-dark">
                        {selectedBrand.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-coffee-dark">{selectedBrand.name}</p>
                    <p className="text-xs text-coffee-roast">{selectedBrand.country}, {selectedBrand.founded}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {errors.brandId && <p className="text-error text-sm mt-1">{errors.brandId}</p>}
        </div>

        {/* 2. NAME */}
        <div>
          <label className="form-label">Naziv kave *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`form-input ${errors.name ? 'border-error' : ''}`}
            placeholder="npr. Qualità Oro"
          />
          {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
        </div>

        {/* 3. Type & Roast */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Vrsta</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="form-input"
            >
              {coffeeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label">Prženje</label>
            <select
              value={formData.roast}
              onChange={(e) => handleChange('roast', e.target.value)}
              className="form-input"
            >
              {roastTypes.map(roast => (
                <option key={roast} value={roast}>{roast}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Arabica/Robusta with 10% steps */}
        <div>
          <label className="form-label">Arabica / Robusta omjer</label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Arabica: {formData.arabicaPercentage}%</span>
                <span className="font-medium">Robusta: {robustaPercentage}%</span>
              </div>
              
              {/* Slider with step indicators */}
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={formData.arabicaPercentage}
                  onChange={(e) => handleChange('arabicaPercentage', e.target.value)}
                  className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                    [&::-webkit-slider-thumb]:bg-coffee-dark [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
                />
                
                {/* Step indicators */}
                <div className="flex justify-between mt-1 px-1">
                  {arabicaSteps.map(step => (
                    <div 
                      key={step} 
                      className={`flex flex-col items-center ${
                        formData.arabicaPercentage == step ? 'text-coffee-dark font-bold' : 'text-neutral-400'
                      }`}
                    >
                      <div className={`w-1 h-2 rounded-full mb-1 ${
                        formData.arabicaPercentage == step ? 'bg-coffee-dark' : 'bg-neutral-300'
                      }`} />
                      <span className="text-[10px]">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Visual bar */}
              <div className="h-4 bg-neutral-200 rounded-full overflow-hidden mt-3 flex">
                <div 
                  className="h-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-300"
                  style={{ width: `${formData.arabicaPercentage}%` }}
                />
                <div 
                  className="h-full bg-gradient-to-r from-amber-800 to-amber-950 transition-all duration-300"
                  style={{ width: `${robustaPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-coffee-roast">
                <span>Arabica (blago, voćno)</span>
                <span>Robusta (snažno, gorko)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. COUNTRY - MULTI SELECT */}
        <div>
          <label className="form-label">Države porijekla * (odaberite jednu ili više)</label>
          
          {/* Selected countries */}
          {formData.countryIds?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.countryIds.map(countryId => {
                const country = countries.find(c => c.id === countryId);
                return country ? (
                  <motion.span
                    key={countryId}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-coffee-dark text-white rounded-full text-sm"
                  >
                    {country.flag} {country.name}
                    <button
                      type="button"
                      onClick={() => toggleCountry(countryId)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ) : null;
              })}
            </div>
          )}
          
          {/* Country selector */}
          {showNewCountry ? (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="form-input"
                placeholder="Nova država"
                autoFocus
              />
              <button type="button" onClick={handleAddCountry} className="btn-primary px-4">
                <Plus className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => setShowNewCountry(false)} className="btn-secondary px-4">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-3">
              <button 
                type="button" 
                onClick={() => setShowNewCountry(true)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Dodaj novu državu
              </button>
            </div>
          )}
          
          {/* Country grid */}
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 rounded-xl ${
            errors.countryIds ? 'bg-red-50 border-2 border-error' : 'bg-coffee-cream/30'
          }`}>
            {countries.map(country => {
              const isSelected = formData.countryIds?.includes(country.id);
              return (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => toggleCountry(country.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'bg-coffee-dark text-white shadow-md'
                      : 'bg-white hover:bg-coffee-light/20 text-coffee-dark'
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="truncate flex-1 text-left">{country.name}</span>
                  {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          {errors.countryIds && <p className="text-error text-sm mt-1">{errors.countryIds}</p>}
        </div>

        {/* 6. Store */}
        <div>
          <label className="form-label">Trgovina *</label>
          {showNewStore ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newStore}
                onChange={(e) => setNewStore(e.target.value)}
                className="form-input"
                placeholder="Nova trgovina"
                autoFocus
              />
              <button type="button" onClick={handleAddStore} className="btn-primary px-4">
                <Plus className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => setShowNewStore(false)} className="btn-secondary px-4">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={formData.storeId}
                onChange={(e) => handleChange('storeId', e.target.value)}
                className={`form-input ${errors.storeId ? 'border-error' : ''}`}
              >
                <option value="">Odaberi trgovinu</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={() => setShowNewStore(true)}
                className="btn-secondary px-4 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
          {errors.storeId && <p className="text-error text-sm mt-1">{errors.storeId}</p>}
        </div>

        {/* 7. Price */}
        <div>
          <label className="form-label">Cijena (EUR) *</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.priceEUR}
              onChange={(e) => handleChange('priceEUR', e.target.value)}
              className={`form-input pr-12 ${errors.priceEUR ? 'border-error' : ''}`}
              placeholder="0.00"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-coffee-roast font-medium">
              €
            </span>
          </div>
          {errors.priceEUR && <p className="text-error text-sm mt-1">{errors.priceEUR}</p>}
        </div>

        {/* 8. Rating */}
        <div>
          <label className="form-label">Ocjena</label>
          <CoffeeBeanRating 
            rating={formData.rating} 
            onChange={(value) => handleChange('rating', value)}
            size={32}
            showLabel
          />
        </div>

        {/* 9. Image - Filename or Upload */}
        <div>
          <label className="form-label">Slika kave (opcionalno)</label>
          
          {/* Toggle between filename and upload */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setImageInputType('filename')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                imageInputType === 'filename'
                  ? 'bg-coffee-dark text-white'
                  : 'bg-neutral-200 text-coffee-roast hover:bg-neutral-300'
              }`}
            >
              Naziv datoteke
            </button>
            <button
              type="button"
              onClick={() => setImageInputType('upload')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                imageInputType === 'upload'
                  ? 'bg-coffee-dark text-white'
                  : 'bg-neutral-200 text-coffee-roast hover:bg-neutral-300'
              }`}
            >
              Upload datoteke
            </button>
          </div>
          
          {imageInputType === 'filename' ? (
            <div>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => handleChange('image', e.target.value)}
                className="form-input"
                placeholder="npr. lavazza-oro.jpg"
              />
              <p className="text-xs text-coffee-roast mt-1">
                Slika mora biti u folderu: <code className="bg-neutral-200 px-1 rounded">{IMAGES_FOLDER}</code>
              </p>
            </div>
          ) : (
            <div>
              <div 
                onClick={() => !uploading && imageInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  uploading 
                    ? 'border-coffee-roast bg-coffee-cream/30 cursor-wait' 
                    : 'border-neutral-300 cursor-pointer hover:border-coffee-roast hover:bg-coffee-cream/20'
                } ${errors.image ? 'border-error bg-red-50' : ''}`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 text-coffee-roast animate-spin" />
                    <span className="text-coffee-dark font-medium">Uploadam sliku...</span>
                  </div>
                ) : imagePreview || formData.image ? (
                  <div className="flex flex-col items-center gap-2">
                    <img 
                      src={imagePreview || `${IMAGES_FOLDER}${formData.image}`}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-xl"
                    />
                    <span className="text-coffee-dark font-medium">{formData.image || 'Nova slika'}</span>
                    <span className="text-xs text-coffee-roast">Klikni za promjenu</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-neutral-400" />
                    <span className="text-coffee-roast">Klikni ili povuci sliku ovdje</span>
                    <span className="text-xs text-neutral-400">PNG, JPG, WebP do 5MB</span>
                  </div>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
                disabled={uploading}
              />
              {errors.image && <p className="text-error text-sm mt-1">{errors.image}</p>}
              <p className="text-xs text-coffee-roast mt-1">
                Slika će biti uploadana na server u: <code className="bg-neutral-200 px-1 rounded">{IMAGES_FOLDER}</code>
              </p>
            </div>
          )}
          
          {/* Image Preview */}
          {formData.image && (
            <div className="mt-3 p-3 bg-coffee-cream/30 rounded-xl">
              <p className="text-xs text-coffee-roast mb-2">Pregled:</p>
              <div className="flex items-center gap-3">
                <img 
                  src={`${IMAGES_FOLDER}${formData.image}`}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg bg-white"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-coffee-dark">{formData.image}</p>
                  <p className="text-xs text-coffee-roast">{IMAGES_FOLDER}{formData.image}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('image', '')}
                  className="p-2 rounded-lg hover:bg-white/50 text-coffee-roast"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            {initialData ? 'Spremi promjene' : 'Dodaj kavu'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              Odustani
            </button>
          )}
        </div>
      </div>
    </motion.form>
  );
}
