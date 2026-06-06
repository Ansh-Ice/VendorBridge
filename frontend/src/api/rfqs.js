// RFQ API functions

import api from "./client";

export const rfqApi = {
  getAll: (params) => api.get("/rfqs", { params }),
  getById: (id) => api.get(`/rfqs/${id}`),
  create: (data) => api.post("/rfqs", data),
  update: (id, data) => api.put(`/rfqs/${id}`, data),
  remove: (id) => api.delete(`/rfqs/${id}`),
};
