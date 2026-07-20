import { getDb } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, otp, type } = body;

    if (!email || !otp || !type) {
      return Response.json(
        { success: false, message: "Email, OTP and type are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Find the latest OTP record
    const otpRecord = await db.collection("otps").findOne({ email, type });

    if (!otpRecord) {
      return Response.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Check if OTP is already expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await db.collection("otps").deleteOne({ _id: otpRecord._id });
      return Response.json(
        { success: false, message: "OTP Expired" },
        { status: 400 }
      );
    }

    // Verify code match
    if (otpRecord.otp !== otp.trim()) {
      const newAttempts = (otpRecord.attempts || 0) + 1;
      
      if (newAttempts >= 5) {
        await db.collection("otps").deleteOne({ _id: otpRecord._id });
        return Response.json(
          { success: false, message: "টানা ৫ বার ভুল OTP দিয়েছেন। নতুন OTP কোড নিন।" },
          { status: 400 }
        );
      } else {
        await db.collection("otps").updateOne(
          { _id: otpRecord._id },
          { $set: { attempts: newAttempts } }
        );
        return Response.json(
          { success: false, message: "Invalid OTP" },
          { status: 400 }
        );
      }
    }

    // OTP is correct!
    if (type === "signup") {
      // Mark user as verified in the user table
      await db.collection("user").updateOne(
        { email },
        { $set: { emailVerified: true } }
      );
      // Clean up/consume signup OTP
      await db.collection("otps").deleteOne({ _id: otpRecord._id });
      return Response.json(
        { success: true, message: "Verification Successful" },
        { status: 200 }
      );
    } else if (type === "reset-password") {
      // Set verified to true, to be consumed by the password reset endpoint
      await db.collection("otps").updateOne(
        { _id: otpRecord._id },
        { $set: { verified: true } }
      );
      return Response.json(
        { success: true, message: "OTP Verified Successfully" },
        { status: 200 }
      );
    }

    return Response.json(
      { success: false, message: "Invalid configuration" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[OTP Verify Error]", err);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
