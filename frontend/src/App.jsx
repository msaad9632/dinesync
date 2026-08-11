// ==========================================
// Main App Component with Routing
// ==========================================
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Tables from './pages/Tables';
import Reservations from './pages/Reservations';
import MenuPage from './pages/MenuPage';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
