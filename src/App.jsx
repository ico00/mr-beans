import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CoffeeProvider } from './hooks/useCoffeeData';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import AdminLogin from './components/AdminLogin';
import Landing from './pages/Landing';
import CoffeeList from './pages/CoffeeList';
import TableView from './pages/TableView';
import AddCoffee from './pages/AddCoffee';
import CoffeeDetail from './pages/CoffeeDetail';
import EditCoffee from './pages/EditCoffee';

function AppContent() {
  const { showAdminLogin, closeLoginModal, login } = useAuth();

  return (
    <>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/coffees" element={<CoffeeList />} />
              <Route path="/table" element={<TableView />} />
              <Route path="/add" element={<AddCoffee />} />
              <Route path="/coffee/:id" element={<CoffeeDetail />} />
              <Route path="/edit/:id" element={<EditCoffee />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      <AdminLogin 
        isOpen={showAdminLogin} 
        onClose={closeLoginModal} 
        onLogin={login} 
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CoffeeProvider>
        <AppContent />
      </CoffeeProvider>
    </AuthProvider>
  );
}

export default App;
