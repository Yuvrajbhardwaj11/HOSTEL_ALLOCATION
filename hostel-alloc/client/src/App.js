import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Rooms from './pages/Rooms';
import Allocations from './pages/Allocations';
import Layout from './components/Layout';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1f2e', color: '#e2e8f0', border: '1px solid #2d3748', borderRadius: '12px' }
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="allocations" element={<Allocations />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
