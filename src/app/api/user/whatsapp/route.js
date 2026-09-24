import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || session.user.id;

    const db = await getDb();
    let query = { _id: targetUserId };
    if (ObjectId.isValid(targetUserId)) {
      query = { $or: [{ _id: new ObjectId(targetUserId) }, { _id: targetUserId }] };
    }

    const user = await db.collection("user").findOne(query);
    return Response.json({
      success: true,
      whatsappNumber: user?.whatsappNumber || null,
    });
  } catch (error) {
    console.error("Error fetching whatsapp number:", error);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const body = await req.json();
    const { whatsappNumber, userId: bodyUserId } = body;

    const targetUserId = session?.user?.id || bodyUserId;
    if (!targetUserId) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!whatsappNumber || typeof whatsappNumber !== "string") {
      return Response.json({ success: false, message: "WhatsApp number is required" }, { status: 400 });
    }

    // Clean number
    let cleaned = whatsappNumber.trim().replace(/[\s\-\(\)]/g, "");

    // Bangladesh phone validation:
    // Accepts +8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX, or 1XXXXXXXXX (10 digits)
    const bdRegex = /^(?:\+?88)?0?(1[3-9]\d{8})$/;
    const match = cleaned.match(bdRegex);

    if (!match) {
      return Response.json(
        { 
          success: false, 
          message: "অনুগ্রহ করে সঠিক মোবাইল নাম্বার দিন (যেমন: 1994810914)" 
        }, 
        { status: 400 }
      );
    }

    // Format consistently as +8801XXXXXXXXX
    const tenDigits = match[1]; // e.g. "1994810914"
    const formattedWithCode = `+880${tenDigits}`;

    const db = await getDb();
    let query = { _id: targetUserId };
    if (ObjectId.isValid(targetUserId)) {
      query = { $or: [{ _id: new ObjectId(targetUserId) }, { _id: targetUserId }] };
    }

    const updateRes = await db.collection("user").updateOne(
      query,
      {
        $set: {
          whatsappNumber: formattedWithCode,
          updatedAt: new Date(),
        },
      }
    );

    if (updateRes.matchedCount === 0 && session?.user?.email) {
      await db.collection("user").updateOne(
        { email: session.user.email },
        {
          $set: {
            whatsappNumber: formattedWithCode,
            updatedAt: new Date(),
          },
        }
      );
    }

    return Response.json({
      success: true,
      message: "WhatsApp number saved successfully",
      whatsappNumber: formattedWithCode,
    });
  } catch (error) {
    console.error("Error saving whatsapp number:", error);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
