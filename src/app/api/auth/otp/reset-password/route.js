import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return Response.json(
        { success: false, message: "Email and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if there is a verified OTP session in otps
    const otpRecord = await db.collection("otps").findOne({
      email,
      type: "reset-password",
      verified: true,
    });

    if (!otpRecord) {
      return Response.json(
        { success: false, message: "অনুগ্রহ করে ওটিপি প্রথমে ভেরিফাই করুন।" },
        { status: 400 }
      );
    }

    // Check if the OTP session has expired (10 minutes)
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await db.collection("otps").deleteOne({ _id: otpRecord._id });
      return Response.json(
        { success: false, message: "OTP validation session expired" },
        { status: 400 }
      );
    }

    // Find the user ID
    const user = await db.collection("user").findOne({ email });
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userId = user.id || user._id.toString();

    // Delete existing verification tokens for this user first
    await db.collection("verification").deleteMany({ value: userId });

    // Request password reset through Better Auth API on server-side
    try {
      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: "http://localhost", // Not actually navigated to
        },
        headers: req.headers,
      });
    } catch (apiErr) {
      console.error("[Better Auth Request Reset Error]", apiErr);
      return Response.json(
        { success: false, message: "Failed to generate password reset request" },
        { status: 500 }
      );
    }

    // Fetch the generated token from verification table
    const verificationRecord = await db.collection("verification")
      .find({
        value: userId,
        identifier: { $regex: /^reset-password:/ },
      })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();

    if (!verificationRecord) {
      return Response.json(
        { success: false, message: "Password reset token generation failed" },
        { status: 500 }
      );
    }

    // Extract the token
    const token = verificationRecord.identifier.split("reset-password:")[1];

    // Call Better Auth to reset password (hashes the password securely and updates it)
    try {
      await auth.api.resetPassword({
        body: {
          newPassword,
          token,
        },
      });
    } catch (resetErr) {
      console.error("[Better Auth Reset Password Error]", resetErr);
      return Response.json(
        { success: false, message: resetErr.message || "Failed to update password" },
        { status: 500 }
      );
    }

    // Consume the OTP record & the Better Auth verification record
    await db.collection("otps").deleteOne({ _id: otpRecord._id });
    await db.collection("verification").deleteOne({ _id: verificationRecord._id });

    return Response.json(
      { success: true, message: "Password Changed Successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Reset Password Error]", err);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
