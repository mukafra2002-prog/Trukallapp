import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import "@/App.css";

// Import pages
import LandingPage from "./pages/LandingPage";
import DriverDashboard from "./pages/DriverDashboard";
import PartnerDashboard from "./pages/PartnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ParkingDetails from "./pages/ParkingDetails";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="App dark">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <Navigate to={`/${user.role}`} /> : <LandingPage />} />
            <Route path="/driver" element={user?.role === 'driver' ? <DriverDashboard /> : <Navigate to="/" />} />
            <Route path="/partner" element={user?.role === 'partner' ? <PartnerDashboard /> : <Navigate to="/" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/spot/:spotId" element={<ParkingDetails />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            <Route path="/subscription-success" element={<SubscriptionSuccess />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" expand={false} richColors />
      </div>
    </AuthContext.Provider>
  );
}

export default App;
export { API };
