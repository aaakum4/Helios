const nodemailer = require("nodemailer");

// Serverless function for Vercel
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Check SMTP configuration
    const requiredKeys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
    const missingKeys = requiredKeys.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
      return res.status(503).json({
        ok: false,
        error: `SMTP is not configured. Missing: ${missingKeys.join(", ")}`,
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

    // Create transporter for this request
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: toEmail,
      subject: subject || "Helios priority reminder",
      text,
      html: html || undefined,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({
      ok: false,
      error: `Failed to send email: ${error.message || String(error)}`,
    });
  }
}
