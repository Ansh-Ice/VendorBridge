// Quotation API functions

import api from "./client";

export const quotationApi = {
  getAll: (params) => api.get("/quotations", { params }),
  create: (data) => api.post("/quotations", data),
  updateStatus: (id, status) => api.patch(`/quotations/${id}/status`, { status }),
};
