// VendorBridge — Main App with Routing

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./features/dashboard/Dashboard";
import VendorList from "./features/vendors/VendorList";
import RFQList from "./features/rfq/RFQList";
import RFQCreate from "./features/rfq/RFQCreate";
import QuotationList from "./features/quotations/QuotationList";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vendors" element={<VendorList />} />
          <Route path="rfqs" element={<RFQList />} />
          <Route path="rfqs/create" element={<RFQCreate />} />
          <Route path="quotations" element={<QuotationList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
