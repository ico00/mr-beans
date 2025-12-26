import { useState } from 'react';
import toast from 'react-hot-toast';

// Koristi relativni /api u produkciji; u developmentu se može postaviti VITE_API_URL
// U produkciji, frontend i backend su na istoj domeni, pa koristimo relativni path
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : (import.meta.env.VITE_API_URL || '/api');

function AdminLogin({ isOpen, onClose, onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Kreiraj AbortController za timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sekundi timeout

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Provjeri Content-Type prije parsiranja JSON-a
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');

            // Ako response nije OK, pokušaj parsirati error poruku
            if (!response.ok) {
                let errorMessage = 'Pogrešna lozinka';
                
                // Pokušaj parsirati JSON error ako postoji
                if (isJson) {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error?.message || errorMessage;
                        
                        // Provjeri da li je rate limit greška
                        if (response.status === 429) {
                            errorMessage = errorData.message || 'Previše pokušaja prijave. Pokušajte ponovno za 15 minuta.';
                        }
                    } catch (parseError) {
                        console.error('Greška pri parsiranju error response:', parseError);
                    }
                } else {
                    // Ako nije JSON, provjeri status kod
                    if (response.status === 404) {
                        errorMessage = 'API endpoint nije pronađen. Provjerite konfiguraciju servera.';
                    } else if (response.status >= 500) {
                        errorMessage = 'Greška na serveru. Molimo pokušajte ponovno kasnije.';
                    } else if (response.status === 429) {
                        errorMessage = 'Previše pokušaja prijave. Pokušajte ponovno za 15 minuta.';
                    }
                }
                
                setError(errorMessage);
                toast.error(errorMessage);
                return;
            }

            // Ako je response OK, parsiraj JSON
            if (!isJson) {
                throw new Error('Server je vratio neispravan format odgovora (očekivan JSON)');
            }

            const data = await response.json();

            if (data.success) {
                // Sačuvaj token u localStorage
                localStorage.setItem('adminToken', data.token);
                setPassword('');
                onLogin(data.token);
                toast.success('Uspješno prijavljen kao admin!');
                onClose();
            } else {
                const errorMessage = data.message || data.error?.message || 'Pogrešna lozinka';
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } catch (err) {
            // Detaljnija greška ovisno o tipu problema
            let errorMsg = '';
            
            if (err.name === 'AbortError' || err.name === 'TimeoutError') {
                errorMsg = 'Zahtjev je prekoračio vrijeme čekanja. Provjerite internetsku vezu.';
            } else if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('NetworkError'))) {
                errorMsg = `Nije moguće povezati se sa serverom (${API_URL}). Provjerite da li je backend server pokrenut i dostupan.`;
            } else if (err.name === 'SyntaxError') {
                errorMsg = 'Server je vratio neispravan odgovor. Provjerite da li je backend server ispravno konfiguriran.';
            } else {
                errorMsg = `Greška pri povezivanju sa serverom: ${err.message}`;
            }
            
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Login error:', err);
            console.error('API URL:', API_URL);
            console.error('Error details:', {
                name: err.name,
                message: err.message,
                stack: err.stack
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold text-coffee-dark flex items-center gap-2">
                        <span>🔐</span> Admin Pristup
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-coffee-roast hover:text-coffee-dark transition-colors"
                    >
                        <span className="text-2xl">×</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-coffee-dark mb-2">
                            Lozinka
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Unesite admin lozinku"
                            className="w-full px-4 py-3 rounded-lg border-2 border-coffee-light bg-white text-coffee-dark focus:border-coffee-dark focus:outline-none transition-colors"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3">
                            <p className="text-red-800 text-sm font-semibold flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg border-2 border-coffee-light text-coffee-dark font-semibold hover:bg-coffee-cream/50 transition-colors"
                            disabled={loading}
                        >
                            Otkaži
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-lg bg-coffee-dark hover:bg-coffee-roast text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading || !password}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">⏳</span> Provjeravam...
                                </>
                            ) : (
                                <>
                                    <span>🔓</span> Unlock
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 pt-6 border-t border-coffee-light">
                    <p className="text-xs text-coffee-roast text-center">
                        🔒 Sigurna autentifikacija sa JWT tokenima
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;

