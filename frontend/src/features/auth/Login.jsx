// Login page component

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAutofillAndSubmit = async (email) => {
    setError(null);
    setSubmitting(true);
    const password = "password123";
    setFormData({ email, password });
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">Bridge 🌉</span>
          <h2>Welcome back</h2>
          <p>Login to your VendorBridge procurement portal</p>
        </div>

        {error && <div className="auth-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. buyer@vendorbridge.com"
              required
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <a href="#forgot" className="forgot-link">Forgot?</a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={submitting}>
            {submitting ? "Logging in..." : "Login to Workspace"}
          </button>
        </form>

        <div className="demo-credentials-box">
          <div className="demo-title">Demo Credentials (Click to Autofill)</div>
          <div className="demo-buttons-grid">
            <button type="button" className="demo-autofill-btn" onClick={() => handleAutofillAndSubmit("buyer@vendorbridge.com")}>
              <span>Buyer (Procurement)</span>
              <span className="demo-email">buyer@vendorbridge.com</span>
            </button>
            <button type="button" className="demo-autofill-btn" onClick={() => handleAutofillAndSubmit("vendor@techsupply.com")}>
              <span>Vendor (TechSupply)</span>
              <span className="demo-email">vendor@techsupply.com</span>
            </button>
            <button type="button" className="demo-autofill-btn" onClick={() => handleAutofillAndSubmit("approver@vendorbridge.com")}>
              <span>Finance Manager (Approver)</span>
              <span className="demo-email">approver@vendorbridge.com</span>
            </button>
            <button type="button" className="demo-autofill-btn" onClick={() => handleAutofillAndSubmit("admin@vendorbridge.com")}>
              <span>Admin (All Access)</span>
              <span className="demo-email">admin@vendorbridge.com</span>
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
