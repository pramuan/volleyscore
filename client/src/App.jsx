import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Management from './views/Management';
import Controller from './views/Controller';
import Display from './views/Display';
import PartialDisplay from './views/PartialDisplay';
import Login from './views/Login';

import { useState, useEffect } from 'react';
import pb from './lib/pocketbase';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);

  useEffect(() => {
    // Check periodically or subscribe to auth changes
    const checkAuth = () => {
      setIsAuthenticated(pb.authStore.isValid);
    };

    // Subscribe to auth store changes
    const unsubscribe = pb.authStore.onChange(checkAuth);

    return () => {
      unsubscribe();
    }
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          success: {
            style: {
              background: '#333',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#333',
            },
          },
          error: {
            style: {
              background: '#333',
              color: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/management" replace />} />

        {/* Protected Management Route */}
        <Route path="/management" element={
          <ProtectedRoute>
            <Management />
          </ProtectedRoute>
        } />

        {/* Helper route to catch /controller without matchId */}
        <Route path="/controller" element={<div className="p-4">Please select a match from Management dashboard.</div>} />
        <Route path="/controller/:matchId" element={<Controller />} />

        {/* Helper route to catch /display without matchId */}
        <Route path="/display" element={<div className="p-4">Please select a match from Management dashboard.</div>} />
        <Route path="/display/:matchId" element={<Display />} />

        {/* Partial Display Routes for OBS/vMix */}
        <Route path="/display/:matchId/:team/:category" element={<PartialDisplay />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
