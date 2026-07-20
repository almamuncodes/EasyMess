import { getDb } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, type } = body;

    if (!email || !type) {
      return Response.json(
        { success: false, message: "Email and type are required" },
        { status: 400 }
      );
    }

    if (type !== "signup" && type !== "reset-password") {
      return Response.json(
        { success: false, message: "Invalid OTP type" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check resend cooldown (60 seconds)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await db.collection("otps").findOne({
      email,
      type,
      createdAt: { $gt: oneMinuteAgo },
    });

    if (recentOtp) {
      return Response.json(
        { success: false, message: "পুনরায় OTP পাঠাতে কমপক্ষে ৬০ সেকেন্ড অপেক্ষা করুন।" },
        { status: 429 }
      );
    }

    // For reset-password, verify the user actually exists
    if (type === "reset-password") {
      const user = await db.collection("user").findOne({ email });
      if (!user) {
        return Response.json(
          { success: false, message: "এই ইমেল দিয়ে কোনো অ্যাকাউন্ট রেজিস্টার করা নেই।" },
          { status: 404 }
        );
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete older OTPs for this email & type
    await db.collection("otps").deleteMany({ email, type });

    // Insert new OTP
    await db.collection("otps").insertOne({
      email,
      otp,
      type,
      expiresAt,
      createdAt: new Date(),
      attempts: 0,
    });

    // Send email via mail utility
    await sendOtpEmail(email, otp, type);

    return Response.json(
      { success: true, message: "OTP Sent Successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[OTP Send Error]", err);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
