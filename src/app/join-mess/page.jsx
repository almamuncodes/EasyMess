"use client";
import { GetUser } from '@/components/action/action';
import React, { useState } from 'react';
import { toast } from 'sonner';

const JoinMessPage = () => {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const user = GetUser();
  const userId = user?.user?.id;
  const userName = user?.user?.name;
  const  userEmail = user?.user?.email;
  const  userImage = user?.user?.image;
  
//   modal 
  const [modal, setModal] = useState({ 
    show: false, 
    title: "", 
    message: "", 
    type: "success" // 'success'
  });

  const handleJoinRequest = async () => {
    if (!inviteCode) return toast.warning("please enter invite code");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/join-mess-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, inviteCode , userName, userEmail, userImage }),
      });

      const data = await res.json();
      

      if (res.ok) {
       
        setModal({
          show: true,
          title: "Request Sent!",
          message: `Your request has been sent to ${data.messName || "the mess you requested"}. Please wait for approval.`,
          type: "success"
        });
      } else if (res.status === 409) {
        // user allcreated
        setModal({
          show: true,
          title: data.message === 'Request already pending please wait for approval' ? "Already Requested": "Already Member",
          message: ` ${data.message || "something went wrong"}`,
          type: "info"
        });
      } else {
        toast.error(data.message || "Something went wrong");
      }
      setInviteCode("");
    } catch (error) {
      toast.error("Server error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      {/* ইনপুট কার্ড */}
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Join Mess</h2>
        <input
          type="text"
          placeholder="Enter Invite Code"
          
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="w-full px-4 py-3 mb-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <button
          onClick={handleJoinRequest}
          disabled={loading}
          className="w-full py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition hover:cursor-pointer"
        >
          {loading ? "Processing..." : "Join Now"}
        </button>
      </div>

     {/* daynamic modal */}
      {modal.show && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-80 text-center animate-in zoom-in duration-300">
            <div className="text-4xl mb-4">{modal.type === "success" ? "✅" : "ℹ️"}</div>
            <h3 className="text-lg font-bold text-gray-800">{modal.title}</h3>
            <p className="text-gray-600 mt-2">{modal.message}</p>
            <button
              onClick={() => setModal({ ...modal, show: false })}
              className="mt-6 w-full py-2 bg-gray-800 text-white rounded-xl hover:bg-black transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinMessPage;