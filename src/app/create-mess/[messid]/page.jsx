"use client";

import { GetUser } from "@/components/action/action";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";


export default function SetupMemberPage() {
    const hasRun = useRef(false);
const params = useParams();
const  messId  = params?.messid;
  console.log(messId);
  const router = useRouter();
  const user = GetUser();
  const userData = user?.user;
  // console.log(userData);
 useEffect(() => {
  if (!userData || !messId) return;

  if (hasRun.current) return;

  hasRun.current = true;

  addCreatorAsMember();
}, [userData, messId]);

  const addCreatorAsMember = async () => {
    const memberData = {
      
      email: userData.email,
     
      role: "manager",      
      status: "active",
      userId: userData.id,
      messId: messId,       
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/createmember`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(memberData),
      });

      const result = await res.json();
   
      if (result.success) {
        toast.success("Mess setup complete! You are now a manager.");
        router.push("/dashboard"); 
      }
    } catch (err) {
      console.error("Member creation failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
  <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-gray-100">

    {/* Loading */}
    <div className="flex flex-col items-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600"></div>

      <h1 className="mt-5 text-2xl font-bold text-gray-800">
        Setting up your mess...
      </h1>

      <p className="mt-2 text-center text-gray-500">
        Please wait while we prepare everything for you.
      </p>
    </div>

    {/* Notice */}
    <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-xl">
          ⚠️
        </div>

        <div>
          <h3 className="font-semibold text-yellow-800">
            Important Notice
          </h3>

          <p className="mt-1 text-sm leading-6 text-yellow-700">
            You can create only one mess per account. If you already have a
            mess, you won't be able to create another one.
          </p>
        </div>
      </div>
    </div>

  </div>
</div>
  );
}