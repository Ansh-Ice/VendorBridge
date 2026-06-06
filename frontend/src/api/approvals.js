// Approval API functions

import api from "./client";

export const approvalApi = {
  getAll: (params) => api.get("/approvals", { params }),
  getById: (id) => api.get(`/approvals/${id}`),
  create: (data) => api.post("/approvals", data),
  decide: (id, data) => api.post(`/approvals/${id}/decide`, data),
};
