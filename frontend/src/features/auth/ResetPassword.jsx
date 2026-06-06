import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import "./Auth.css";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetToken = useMemo(
    () => location.state?.resetToken || sessionStorage.getItem("passwordResetToken"),
    [location.state]
  );
  const email = location.state?.email || sessionStorage.getItem("passwordResetEmail");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(resetToken ? null : "Verify your email OTP before resetting password.");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      setError("Verify your email OTP before resetting password.");
      return;
    }

    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const response = await authApi.resetPassword({ resetToken, newPassword });
      sessionStorage.removeItem("passwordResetToken");
      sessionStorage.removeItem("passwordResetEmail");
      setMessage(response.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.message || "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">VendorBridge</span>
          <h2>Set new password</h2>
          <p>{email ? `Resetting password for ${email}` : "Enter your new password"}</p>
        </div>

        {error && <div className="auth-error-message">{error}</div>}
        {message && <div className="auth-success-message">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
              disabled={!resetToken || submitting}
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={!resetToken || submitting}>
            {submitting ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <div className="auth-footer">
          Need a code? <Link to="/forgot-password">Request OTP</Link>
        </div>
      </div>
    </div>
  );
}
