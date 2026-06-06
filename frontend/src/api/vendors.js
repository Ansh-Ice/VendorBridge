// Vendor API functions

import api from "./client";

export const vendorApi = {
  getAll: (params) => api.get("/vendors", { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post("/vendors", data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  remove: (id) => api.delete(`/vendors/${id}`),
};
