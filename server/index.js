require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow requests from your frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

app.use(express.json());

// Create SMTP transporter
let mailTransporter = null;

function initializeMailTransporter() {
  const requiredKeys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
  const missingKeys = requiredKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    console.warn(`SMTP not configured. Missing: ${missingKeys.join(", ")}`);
    return null;
  }

  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (error) {
    console.error("Failed to create mail transporter:", error);
    return null;
  }
}

mailTransporter = initializeMailTransporter();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    ok: true, 
    smtp_configured: !!mailTransporter 
  });
});

// Email sending endpoint
app.post("/api/send-email", async (req, res) => {
  try {
    if (!mailTransporter) {
      return res.status(503).json({
        ok: false,
        error: "SMTP is not configured on the server. Contact the administrator.",
      });
    }

    const { toEmail, subject, text, html } = req.body;

    // Validate required fields
    if (!toEmail || !text) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: toEmail and text are required",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid email address",
      });
    }

    // Send email
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: toEmail,
      subject: subject || "Helios priority reminder",
      text,
      html: html || undefined,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({
      ok: false,
      error: `Failed to send email: ${error.message || String(error)}`,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Helios email server running on port ${PORT}`);
  console.log(`SMTP configured: ${!!mailTransporter}`);
});
