// Auth API functions

import api from "./client";

export const authApi = {
  register: (data) => api.post("/register", data),
  verifyRegistrationOtp: (data) => api.post("/register/verify-otp", data),
  login: (data) => api.post("/login", data),
  requestPasswordResetOtp: (data) => api.post("/forgot-password/request-otp", data),
  verifyPasswordResetOtp: (data) => api.post("/forgot-password/verify-otp", data),
  resetPassword: (data) => api.post("/reset-password", data),
  changePassword: (data) => api.post("/change-password", data),
  me: () => api.get("/me"),
};
