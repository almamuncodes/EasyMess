"use client";
import Image from "next/image";
import { GetUser } from "@/components/action/action";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const PendingRequestsPage = () => {
  const user = GetUser();
  const userId = user?.user?.id;
  const [requests, setRequests] = useState([]);
  const [messId, setMessId] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push("/signin");
    }
    if (!userId) return;

    const fetchData = async () => {
      try {
        const messRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/member/messid/${userId}`,
        );
        const messData = await messRes.json();

        if (messData?.messId) {
          setMessId(messData.messId);
          const reqRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/mess/pending-requests/${messData.messId}`,
          );
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mess/handle-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            action,
            messId,
            managerId: userId,
            userData: {
              userId: reqData.userId,
              
              userEmail: reqData.userEmail,
             
            },
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        setRequests(requests.filter((r) => r._id !== requestId));
        setShowModal(false);
        toast.success(result.message || "Request has been approved");
      }
    } catch (err) {
      toast.error("Something went wrong!");
    }
  };

  if (loading)
    return (
      <div className="bg-[#f2f4f1] min-h-[100vh] rounded-xl flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">
          {" "}
          searching for pending requests...
        </p>
      </div>
    );

  return (
    <div className="p-6 bg-[#f2f4f1] min-h-[100vh] rounded-xl ">
      <h1 className="text-2xl font-bold mb-4">Pending Join Requests</h1>
      {requests.length === 0 ? (
        <div className=" p-8 rounded-2xl border border-gray-100 bg-orange-100 shadow-sm text-center">
          <p className="text-gray-600 font-medium">
            No pending requests found.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Check back later for new join requests.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300"
            >
              {/* User Info Section -  */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Image
                  width={56}
                  height={56}
                  src={req.userImage || "/default-avatar.png"}
                  alt={req.userName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-50 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 text-lg truncate">
                    {req.userName}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {req.userEmail}
                  </p>
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleAction(req._id, "approve", req)}
                  className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl transition font-semibold hover:cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedReq(req);
                    setShowModal(true);
                  }}
                  className="flex-1 md:flex-none bg-red-50 text-red-500 hover:bg-red-100 px-6 py-2.5 rounded-xl transition font-semibold hover:cursor-pointer"
                >
                  Reject
                </button>
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
            <p>
              Are you sure you want to reject {selectedReq?.userName}'s request?
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(selectedReq._id, "reject", selectedReq)
                }
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequestsPage;
