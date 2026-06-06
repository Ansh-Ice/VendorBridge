import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { authApi } from "../../api/auth";
import "./Auth.css";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and retyped password do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authApi.changePassword(formData);
      setMessage(response.message || "Password changed successfully.");
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message || "Could not change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="password-page">
      <div className="password-panel">
        <div className="password-panel-header">
          <div className="password-panel-icon">
            <LockKeyhole size={22} />
          </div>
          <div>
            <h1>Change password</h1>
            <p>Update the password used to access your VendorBridge account.</p>
          </div>
        </div>

        {error && <div className="auth-error-message">{error}</div>}
        {message && <div className="auth-success-message">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="oldPassword">Old password</label>
            <input
              id="oldPassword"
              name="oldPassword"
              type="password"
              value={formData.oldPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Retype new password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={submitting}>
            {submitting ? "Changing password..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
