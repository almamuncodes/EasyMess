import nodemailer from "nodemailer";

export async function sendOtpEmail(email, otp, type) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `"EasyMess" <no-reply@easymess.com>`;

  const subject = type === "signup" 
    ? "EasyMess Account Verification Code" 
    : "EasyMess Password Reset Code";

  const messageText = type === "signup"
    ? `Your verification code is ${otp}. It is valid for 10 minutes.`
    : `Your password reset code is ${otp}. It is valid for 10 minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #f97316; text-align: center; margin-bottom: 5px;">EasyMess</h2>
      <p style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 0;">Simplify your mess life</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 16px; color: #374151;">Hello,</p>
      <p style="font-size: 16px; color: #374151;">
        ${type === "signup" ? "Thank you for registering with EasyMess. Please use the following One-Time Password (OTP) to verify your email address:" : "We received a request to reset your password. Please use the following One-Time Password (OTP) to proceed:"}
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f97316; padding: 10px 20px; background-color: #fff7ed; border: 1px dashed #f97316; border-radius: 8px; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 14px; color: #6b7280; text-align: center;">
        This code is valid for 10 minutes. Do not share this code with anyone.
      </p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-top: 30px;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        If you did not request this, please ignore this email.
      </p>
    </div>
  `;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: subject,
        text: messageText,
        html: html,
      });

      console.log(`[SMTP] Verification email sent to ${email}`);
      return true;
    } catch (err) {
      console.error("[SMTP Error] Failed to send email via SMTP:", err);
    }
  }

  // Fallback / Development Mode
  console.log("\n========================================");
  console.log(`[DEV EMAIL FALLBACK]`);
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`OTP Code: ${otp}`);
  console.log("========================================\n");
  return true;
}
