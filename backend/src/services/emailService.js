const nodemailer = require("nodemailer");

const isProduction = process.env.NODE_ENV === "production";

const requiredSmtpVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];

let transporter;

const getTransporter = () => {
  // Check if any SMTP variables are partially configured
  const anySmtpVarSet = requiredSmtpVars.some((key) => Boolean(process.env[key]));

  if (!anySmtpVarSet) {
    if (isProduction) {
      throw new Error("SMTP configuration is required in production.");
    }
    return null;
  }

  // Gmail Auto-configuration helper
  const user = process.env.SMTP_USER;
  const isGmail = user && user.toLowerCase().endsWith("@gmail.com");

  const host = process.env.SMTP_HOST || (isGmail ? "smtp.gmail.com" : "");
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : (isGmail ? 465 : 587);
  const secure = process.env.SMTP_SECURE !== undefined && process.env.SMTP_SECURE !== ""
    ? process.env.SMTP_SECURE === "true" 
    : (isGmail && port === 465);
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || (isGmail ? `"VendorBridge" <${user}>` : "");

  // Validate that all required configuration variables are present
  const missing = [];
  if (!host) missing.push("SMTP_HOST");
  if (!port) missing.push("SMTP_PORT");
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASS");
  if (!from) missing.push("SMTP_FROM");

  if (missing.length > 0) {
    throw new Error(`SMTP configuration is incomplete. Missing variables: ${missing.join(", ")}`);
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
};

const sendMail = async ({ to, subject, text, html, devOtp }) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.log(`[DEV OTP] ${subject} for ${to}: ${devOtp}`);
    try {
      const fs = require("fs");
      const path = require("path");
      const logPath = path.join(__dirname, "../../dev_otp.log");
      fs.writeFileSync(logPath, `[${new Date().toISOString()}] To: ${to} | Subject: ${subject} | OTP: ${devOtp}\n`);
    } catch (err) {
      console.error("Failed to write dev OTP to log file:", err);
    }
    return { skipped: true };
  }

  try {
    return await mailer.sendMail({
      from: process.env.SMTP_FROM || mailer.options.from,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("SMTP Error during sendMail:", err);
    throw new Error(`Failed to send email. Please check your SMTP configuration: ${err.message}`);
  }
};

module.exports = { sendMail };
