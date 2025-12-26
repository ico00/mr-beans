import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

// Funkcija za određivanje API URL-a na runtime
// U produkciji (na fly.dev), frontend i backend su na istoj domeni, pa koristimo relativni path
// U developmentu, koristimo VITE_API_URL ili localhost
const getApiUrl = () => {
  // Ako je postavljen VITE_API_URL, koristi ga (za development)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Provjeri da li smo na localhostu (development)
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');
  
  if (isLocalhost) {
    return 'http://localhost:3001/api';
  }
  
  // U produkciji, koristi relativni path (frontend i backend su na istoj domeni)
  return '/api';
};

const API_URL = getApiUrl();

// Kreiraj context
const AuthContext = createContext(null)

/**
 * AuthProvider - upravljanje admin autentikacijom
 */
export function AuthProvider({ children, onAuthChange }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState(null)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  /**
   * Provjeri validnost admin tokena
   */
  const verifyToken = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.valid) {
        setIsAdmin(true)
        setAdminToken(token)
        return true
      } else {
        // Token nije validan, ukloni ga
        localStorage.removeItem('adminToken')
        setIsAdmin(false)
        setAdminToken(null)
        return false
      }
    } catch (error) {
      console.error('Greška pri provjeri tokena:', error)
      localStorage.removeItem('adminToken')
      setIsAdmin(false)
      setAdminToken(null)
      return false
    }
  }, [])

  /**
   * Login - prijava admina
   */
  const login = useCallback(async (token) => {
    console.log('🔐 Admin login, token:', token ? 'postoji' : 'nema')
    setAdminToken(token)
    setIsAdmin(true)
    localStorage.setItem('adminToken', token)
    setShowAdminLogin(false)
    console.log('✅ Admin prijavljen')
    
    // Notify parent about auth change (to refresh data)
    if (onAuthChange) {
      onAuthChange()
    }
  }, [onAuthChange])

  /**
   * Logout - odjava admina
   */
  const logout = useCallback(() => {
    localStorage.removeItem('adminToken')
    setAdminToken(null)
    setIsAdmin(false)
    toast.success('Uspješno odjavljen')
    console.log('🔓 Admin odjavljen')
  }, [])

  /**
   * Dohvati Authorization header za API pozive
   */
  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' }
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`
    }
    return headers
  }, [adminToken])

  /**
   * Otvori/zatvori login modal
   */
  const openLoginModal = useCallback(() => setShowAdminLogin(true), [])
  const closeLoginModal = useCallback(() => setShowAdminLogin(false), [])

  // Provjeri postojeći token pri učitavanju
  useEffect(() => {
    const checkExistingToken = async () => {
      // Na localhostu (development) automatski omogući admin ovlasti
      // U produkciji, import.meta.env.PROD će biti true
      const isDevelopment = !import.meta.env.PROD && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      
      if (isDevelopment) {
        console.log('🔓 Development mode: automatski admin ovlasti omogućene')
        
        // Provjeri da li postoji validan token
        let token = localStorage.getItem('adminToken')
        
        // Ako nema tokena, automatski se prijavi s default lozinkom
        if (!token) {
          try {
            const response = await fetch(`${API_URL}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: 'admin123' })
            })
            
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.token) {
                token = data.token
                localStorage.setItem('adminToken', token)
                console.log('✅ Automatski login u development mode-u uspješan')
              }
            } else {
              console.warn('⚠️ Server je dostupan ali login nije uspio. Provjerite da li je server pokrenut.')
            }
          } catch (error) {
            console.warn('⚠️ Server nije dostupan. Pokrenite server s `npm run server` za potpune admin ovlasti.')
            console.warn('   Za sada će admin ovlasti biti omogućene, ali API pozivi neće raditi bez servera.')
          }
        } else {
          // Provjeri da li je postojeći token validan
          try {
            const isValid = await verifyToken(token)
            if (!isValid) {
              // Token nije validan, pokušaj novi login
              token = null
              localStorage.removeItem('adminToken')
            }
          } catch (error) {
            console.warn('⚠️ Greška pri provjeri tokena:', error)
          }
        }
        
        // Postavi admin status - u development mode-u uvijek omogući admin
        setIsAdmin(true)
        if (token) {
          setAdminToken(token)
          console.log('🔐 Admin token postavljen')
        } else {
          console.log('🔓 Development mode: admin omogućen, ali token nije dostupan (pokrenite server)')
        }
        setLoading(false)
        return
      }
      
      // U produkciji provjeri token - bez tokena nema admin pristupa
      const token = localStorage.getItem('adminToken')
      if (token) {
        const isValid = await verifyToken(token)
        if (!isValid) {
          // Token nije validan, ukloni ga i onemogući admin
          localStorage.removeItem('adminToken')
          setIsAdmin(false)
          setAdminToken(null)
        }
      } else {
        // Nema tokena u produkciji = nema admin pristupa
        setIsAdmin(false)
        setAdminToken(null)
      }
      setLoading(false)
    }
    
    checkExistingToken()
  }, [verifyToken])

  // Debug logging
  useEffect(() => {
    console.log('🔐 Auth status:', { 
      isAdmin, 
      hasToken: !!adminToken,
      isReadOnly: !isAdmin
    })
  }, [isAdmin, adminToken])

  // Context value
  const value = {
    // State
    isAdmin,
    adminToken,
    showAdminLogin,
    loading,
    
    // Computed
    isReadOnly: !isAdmin,
    
    // Actions
    login,
    logout,
    verifyToken,
    getAuthHeaders,
    openLoginModal,
    closeLoginModal
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook za pristup autentikaciji
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth mora biti korišten unutar AuthProvider-a')
  }
  return context
}

export default AuthContext

