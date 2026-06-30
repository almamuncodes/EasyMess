"use client";
import Image from "next/image";
import { GetUser } from "@/components/action/action";
import React, { useEffect, useState } from "react";

const PendingRequestsPage = () => {
  const user = GetUser();
  const userId = user?.user?.id;
  const [requests, setRequests] = useState([]);
  const [messId, setMessId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const messRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/member/messid/${userId}`);
        const messData = await messRes.json();
        
        if (messData?.messId) {
          setMessId(messData.messId);
          const reqRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mess/pending-requests/${messData.messId}`);
          const reqData = await reqRes.json();
          if (reqData?.success) setRequests(reqData.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleAction = async (requestId, action, reqData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mess/handle-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          messId,
          managerId: userId,
          userData: {
            userId: reqData.userId,
            userName: reqData.userName,
            userEmail: reqData.userEmail,
            userImage: reqData.userImage
          }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setRequests(requests.filter(r => r._id !== requestId));
        setShowModal(false);
        alert(result.message);
      }
    } catch (err) {
      alert("Something went wrong!");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Join Requests</h1>
      {requests.length === 0 ? <p>No pending requests found.</p> : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image width={56} height={56} src={req.userImage || "/default-avatar.png"} alt={req.userName} className="w-14 h-14 rounded-full object-cover" />
                <div>
                  <h3 className="font-bold text-lg">{req.userName}</h3>
                  <p className="text-sm text-gray-500">{req.userEmail}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(req._id, "approve", req)} className="bg-green-500 text-white px-4 py-2 rounded-xl">Approve</button>
                <button onClick={() => { setSelectedReq(req); setShowModal(true); }} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Confirm Rejection</h2>
            <p>Are you sure you want to reject {selectedReq?.userName}'s request?</p>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={() => handleAction(selectedReq._id, "reject", selectedReq)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequestsPage;