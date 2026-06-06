// Invoices API functions

import api from "./client";

export const invoiceApi = {
  getAll: (params) => api.get("/invoices", { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  generate: (purchaseOrderId, invoiceDate, dueDate) => api.post("/invoices", { purchaseOrderId, invoiceDate, dueDate }),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
};
