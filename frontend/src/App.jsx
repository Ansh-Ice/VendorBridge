// VendorBridge — Main App with Routing

import { Agentation } from "agentation";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./features/dashboard/Dashboard";
import VendorList from "./features/vendors/VendorList";
import RFQList from "./features/rfq/RFQList";
import RFQCreate from "./features/rfq/RFQCreate";
import RFQDetail from "./features/rfq/RFQDetail";
import RFQCompare from "./features/rfq/RFQCompare";
import QuotationList from "./features/quotations/QuotationList";
import VendorPortal from "./features/quotations/VendorPortal";
import ApprovalList from "./features/approvals/ApprovalList";
import POList from "./features/purchase-orders/POList";
import PODetail from "./features/purchase-orders/PODetail";
import InvoiceList from "./features/invoices/InvoiceList";
import InvoiceDetail from "./features/invoices/InvoiceDetail";
import Landing from "./features/landing/Landing";
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";

export default function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="landing" element={<Landing />} />
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
              
              {/* Procurement Roles + Vendor Role */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "PROCUREMENT_OFFICER", "APPROVER", "VENDOR"]} />}>
                <Route path="rfqs" element={<RFQList />} />
                <Route path="vendor/rfqs" element={<RFQList />} />
                <Route path="rfqs/:id" element={<RFQDetail />} />
              </Route>

              {/* Procurement & Finance Roles (Non-Vendors) */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "PROCUREMENT_OFFICER", "APPROVER"]} />}>
                <Route path="vendors" element={<VendorList />} />
                <Route path="rfqs/:id/compare" element={<RFQCompare />} />
              </Route>

              {/* Approvers & Admins only */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "APPROVER"]} />}>
                <Route path="approvals" element={<ApprovalList />} />
              </Route>

              {/* Vendors only */}
              <Route element={<ProtectedRoute allowedRoles={["VENDOR"]} />}>
                <Route path="rfqs/:id/quote" element={<VendorPortal />} />
              </Route>

              {/* Purchase Orders and Invoices */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"]} />}>
                <Route path="purchase-orders" element={<POList />} />
                <Route path="purchase-orders/:id" element={<PODetail />} />
                <Route path="invoices" element={<InvoiceList />} />
                <Route path="invoices/:id" element={<InvoiceDetail />} />
              </Route>

              {/* Procurement Officer / Admin only */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "PROCUREMENT_OFFICER"]} />}>
                <Route path="rfqs/create" element={<RFQCreate />} />
                <Route path="quotations" element={<QuotationList />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      {import.meta.env.DEV ? <Agentation /> : null}
    </>
  );
}

