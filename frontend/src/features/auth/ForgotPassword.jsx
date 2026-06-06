import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import "./Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const response = await authApi.requestPasswordResetOtp({ email });
      setStep("otp");
      setMessage(response.message || "If an account exists for this email, an OTP has been sent.");
    } catch (err) {
      setError(err.message || "Could not send password reset OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await authApi.verifyPasswordResetOtp({ email, otp });
      const resetToken = response.data.resetToken;
      sessionStorage.setItem("passwordResetToken", resetToken);
      sessionStorage.setItem("passwordResetEmail", email);
      navigate("/reset-password", { state: { resetToken, email } });
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
      const response = await authApi.requestPasswordResetOtp({ email });
      setMessage(response.message || "OTP sent again if this email has an account.");
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
          <h2>Forgot password</h2>
          <p>{step === "email" ? "Get a reset OTP on your email" : "Verify the OTP to continue"}</p>
        </div>

        {error && <div className="auth-error-message">{error}</div>}
        {message && <div className="auth-success-message">{message}</div>}

        {step === "email" ? (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. buyer@vendorbridge.com"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={submitting}>
              {submitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
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
              {submitting ? "Verifying..." : "Verify OTP"}
            </button>

            <button type="button" className="auth-link-button" onClick={handleResendOtp} disabled={submitting}>
              Resend OTP
            </button>
            <button type="button" className="auth-link-button" onClick={() => setStep("email")} disabled={submitting}>
              Use another email
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remembered your password? <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
