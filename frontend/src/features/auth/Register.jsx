// Register page component

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Auth.css";

export default function Register() {
  const { register, verifyRegistrationOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("details");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "PROCUREMENT_OFFICER",
  });
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const requestOtp = async () => {
    const response = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role
    );
    setStep("otp");
    setMessage(response.message || "OTP sent to your email.");
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      await requestOtp();
    } catch (err) {
      setError(err.message || "Registration failed. Try using a different email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await verifyRegistrationOtp(formData.email, otp);
      navigate("/");
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      await requestOtp();
    } catch (err) {
      setError(err.message || "Could not resend OTP yet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">VendorBridge</span>
          <h2>Create account</h2>
          <p>{step === "details" ? "Verify your email before entering the workspace" : "Enter the OTP sent to your email"}</p>
        </div>

        {error && <div className="auth-error-message">{error}</div>}
        {message && <div className="auth-success-message">{message}</div>}

        {step === "details" ? (
          <form onSubmit={handleDetailsSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Jane Smith"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. janesmith@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Workspace Role</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange}>
                <option value="PROCUREMENT_OFFICER">Buyer (Procurement Officer)</option>
                <option value="APPROVER">Approver (Manager)</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={submitting}>
              {submitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp">Email OTP</label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={submitting || otp.length !== 6}>
              {submitting ? "Verifying..." : "Verify and create account"}
            </button>

            <button type="button" className="auth-link-button" onClick={handleResendOtp} disabled={submitting}>
              Resend OTP
            </button>
            <button type="button" className="auth-link-button" onClick={() => setStep("details")} disabled={submitting}>
              Edit account details
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
