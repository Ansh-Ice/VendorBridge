// Purchase Orders API functions

import api from "./client";

export const poApi = {
  getAll: (params) => api.get("/purchase-orders", { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  generate: (approvalRequestId) => api.post("/purchase-orders", { approvalRequestId }),
  updateStatus: (id, status) => api.patch(`/purchase-orders/${id}/status`, { status }),
};
