// Auth service - registration OTP, login, password reset, and JWT token management

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { sendMail } = require("./emailService");

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable must be set in production mode.");
}

const JWT_SECRET = process.env.JWT_SECRET || "vendorbridge_fallback_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 12;

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const OTP_PURPOSE = {
  REGISTER: "REGISTER",
  RESET_PASSWORD: "RESET_PASSWORD",
};

const normalizeEmail = (email) => email.toLowerCase().trim();

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getPublicUserSelect = () => ({
  id: true,
  organizationId: true,
  vendorId: true,
  name: true,
  email: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
});

const buildOtpEmail = ({ subject, intro, code }) => ({
  subject,
  text: `${intro}\n\nYour OTP is ${code}. It expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p>${intro}</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>This OTP expires in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `,
});

const issueOtp = async ({ email, purpose, pendingData, subject, intro }) => {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  const activeOtp = await prisma.authOtp.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (activeOtp && activeOtp.resendAvailableAt > now) {
    throw createError(429, "Please wait before requesting another OTP.");
  }

  await prisma.authOtp.updateMany({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
    },
    data: { consumedAt: now },
  });

  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
  const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS);

  await prisma.authOtp.create({
    data: {
      email: normalizedEmail,
      purpose,
      codeHash,
      pendingDataJson: pendingData ? JSON.stringify(pendingData) : null,
      expiresAt,
      resendAvailableAt,
    },
  });

  const emailContent = buildOtpEmail({ subject, intro, code });
  await sendMail({
    to: normalizedEmail,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
    devOtp: code,
  });

  return { expiresAt, resendAvailableAt };
};

const verifyOtp = async ({ email, purpose, otp }) => {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  const otpRecord = await prisma.authOtp.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw createError(400, "Invalid or expired OTP.");
  }

  if (otpRecord.expiresAt <= now) {
    await prisma.authOtp.update({
      where: { id: otpRecord.id },
      data: { consumedAt: now },
    });
    throw createError(400, "OTP has expired. Please request a new OTP.");
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.authOtp.update({
      where: { id: otpRecord.id },
      data: { consumedAt: now },
    });
    throw createError(429, "Too many invalid OTP attempts. Please request a new OTP.");
  }

  const isValid = await bcrypt.compare(otp, otpRecord.codeHash);

  if (!isValid) {
    const nextAttempts = otpRecord.attempts + 1;
    await prisma.authOtp.update({
      where: { id: otpRecord.id },
      data: {
        attempts: nextAttempts,
        ...(nextAttempts >= MAX_OTP_ATTEMPTS ? { consumedAt: now } : {}),
      },
    });
    throw createError(
      nextAttempts >= MAX_OTP_ATTEMPTS ? 429 : 400,
      nextAttempts >= MAX_OTP_ATTEMPTS
        ? "Too many invalid OTP attempts. Please request a new OTP."
        : "Invalid OTP."
    );
  }

  await prisma.authOtp.update({
    where: { id: otpRecord.id },
    data: { consumedAt: now },
  });

  return otpRecord;
};

const resolveOrganizationId = async (data) => {
  if (data.organizationId) return data.organizationId;

  let firstOrg = await prisma.organization.findFirst();

  if (!firstOrg) {
    firstOrg = await prisma.organization.create({
      data: {
        name: data.organizationName || "Default Organization",
        legalName: data.organizationName || "Default Org Ltd",
        stateCode: "MH",
      },
    });
  }

  return firstOrg.id;
};

const mapRole = (role) => {
  if (role === "BUYER") return "PROCUREMENT_OFFICER";
  return role || "PROCUREMENT_OFFICER";
};

const authService = {
  /**
   * Start registration by sending an OTP. Account creation happens after OTP verification.
   */
  async register(data) {
    const email = normalizeEmail(data.email);

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw createError(409, "A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const pendingData = {
      organizationId: data.organizationId || null,
      organizationName: data.organizationName || null,
      vendorId: data.vendorId || null,
      name: data.name.trim(),
      email,
      password: hashedPassword,
      role: mapRole(data.role),
    };

    const otpMeta = await issueOtp({
      email,
      purpose: OTP_PURPOSE.REGISTER,
      pendingData,
      subject: "Verify your VendorBridge registration",
      intro: "Use this OTP to complete your VendorBridge registration.",
    });

    return {
      message: "OTP sent to your email. Verify it to complete registration.",
      ...otpMeta,
    };
  },

  async verifyRegistrationOtp(email, otp) {
    const otpRecord = await verifyOtp({
      email,
      otp,
      purpose: OTP_PURPOSE.REGISTER,
    });

    const pendingData = JSON.parse(otpRecord.pendingDataJson || "{}");

    if (!pendingData.email || !pendingData.password || !pendingData.name) {
      throw createError(400, "Registration request is no longer valid. Please register again.");
    }

    const existing = await prisma.user.findUnique({ where: { email: pendingData.email } });

    if (existing) {
      throw createError(409, "A user with this email already exists");
    }

    const orgId = await resolveOrganizationId(pendingData);

    const user = await prisma.user.create({
      data: {
        organizationId: orgId,
        vendorId: pendingData.vendorId,
        name: pendingData.name,
        email: pendingData.email,
        password: pendingData.password,
        role: pendingData.role,
      },
      select: getPublicUserSelect(),
    });

    const token = authService.generateToken(user);

    return { user, token };
  },

  /**
   * Login with email and password.
   */
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });

    if (!user) {
      throw createError(401, "Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw createError(401, "Invalid email or password");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { password: _, ...userWithoutPassword } = user;
    const token = authService.generateToken(userWithoutPassword);

    return { user: userWithoutPassword, token };
  },

  async requestPasswordResetOtp(email) {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const response = {
      message: "If an account exists for this email, an OTP has been sent.",
    };

    if (!user) {
      return response;
    }

    const otpMeta = await issueOtp({
      email: normalizedEmail,
      purpose: OTP_PURPOSE.RESET_PASSWORD,
      pendingData: { userId: user.id },
      subject: "Reset your VendorBridge password",
      intro: "Use this OTP to reset your VendorBridge password.",
    });

    return { ...response, ...otpMeta };
  },

  async verifyPasswordResetOtp(email, otp) {
    const otpRecord = await verifyOtp({
      email,
      otp,
      purpose: OTP_PURPOSE.RESET_PASSWORD,
    });

    const pendingData = JSON.parse(otpRecord.pendingDataJson || "{}");
    const user = await prisma.user.findFirst({
      where: {
        id: pendingData.userId,
        email: normalizeEmail(email),
      },
    });

    if (!user) {
      throw createError(400, "Password reset request is no longer valid. Please start again.");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashResetToken(resetToken);
    const resetExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: resetTokenHash,
        passwordResetExpiresAt: resetExpiresAt,
      },
    });

    return { resetToken, expiresAt: resetExpiresAt };
  },

  async resetPassword(resetToken, newPassword) {
    const tokenHash = hashResetToken(resetToken);
    const user = await prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw createError(400, "Invalid or expired password reset request.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: "Password reset successful. You can now login with your new password." };
  },

  async changePassword(userId, oldPassword, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
      throw createError(400, "New password and retyped password do not match.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw createError(404, "User not found");
    }

    const oldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!oldPasswordValid) {
      throw createError(401, "Old password is incorrect.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: "Password changed successfully." };
  },

  /**
   * Get current user profile from token payload.
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...getPublicUserSelect(),
        organization: {
          select: {
            name: true,
            legalName: true,
            gstin: true,
            billingAddress: true,
            stateCode: true,
            currency: true,
          },
        },
        vendor: {
          select: {
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw createError(404, "User not found");
    }

    return user;
  },

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        vendorId: user.vendorId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  },

  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  },
};

module.exports = authService;
