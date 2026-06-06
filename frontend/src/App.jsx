// VendorBridge — Main App with Routing

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./features/dashboard/Dashboard";
import VendorList from "./features/vendors/VendorList";
import RFQList from "./features/rfq/RFQList";
import RFQCreate from "./features/rfq/RFQCreate";
import QuotationList from "./features/quotations/QuotationList";
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Protected Main Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="vendors" element={<VendorList />} />
            <Route path="rfqs" element={<RFQList />} />
            <Route path="rfqs/create" element={<RFQCreate />} />
            <Route path="quotations" element={<QuotationList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

