"use client";

import { GetUser } from "@/components/action/action";
import { useEffect, useState } from "react";

// ⚠️ userId ekhane tomar auth system theke astese bole ধরে নিলাম
// (e.g. next-auth session, firebase auth, jwt decode, ইত্যাদি)
// আপাতত demo hisebe ekta hook use korlam, tumi tomar actual auth hook diye replace kore nio

export default function ManagerSettingsPage() {
  const user = GetUser();
  const userId = user?.user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [messData, setMessData] = useState(null); // full response
  const [mealSettings, setMealSettings] = useState({}); // editable copy
  //   console.log("mealSettings", mealSettings);
  //   console.log("messData", messData);

  // Fetch manager settings on load
  useEffect(() => {
    if (!userId) return;

    const fetchSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/manager/settings/${userId}`,
        );
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to load settings");
        }

        setMessData(data);
        setMealSettings(data.mealSettings || {});
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  const handleFieldChange = (key, value) => {
    setMealSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      console.log(userId, messData?.messId);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/manager/settings/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messId: messData?.messId, // note: GET response doesn't return messId currently,
            // see note below the component about adding it to the backend
            mealSettings,
          }),
        },
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update settings");
      }

      setSuccessMsg("Meal settings updated successfully ✅");
    } catch (err) {
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }

  if (error && !messData) {
    return (
      <div className="mx-auto mt-20 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 ">
      {/* Header / Mess Info Card */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-orange-100 shadow-sm">
        <div className="relative h-44 w-full bg-gray-100">
          {messData?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={messData.image}
              alt={messData.messName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No image uploaded
            </div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {messData?.messName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Loacation: {messData?.messLocation || "Location not set"}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Created{" "}
            {messData?.createdAt
              ? new Date(messData.createdAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>

      {/* Meal Settings Form */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Meal Settings
        </h2>

        {Object.keys(mealSettings).length === 0 ? (
          <p className="text-sm text-gray-400">No meal settings found yet.</p>
        ) : (
          Object.entries(mealSettings).map(([key, value]) => {
            const isTime =
              key.toLowerCase().includes("time") ||
              key.toLowerCase().includes("deadline");

           
            const hourVal =
              typeof value === "string"
                ? parseInt(value.split(":")[0])
                : value || 0;
            const hour =
              hourVal > 12 ? hourVal - 12 : hourVal === 0 ? 12 : hourVal;
            const period = hourVal >= 12 ? "PM" : "AM";

            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-sm font-medium capitalize text-gray-600">
                  {key.replace(/([A-Z])/g, " $1")}
                </label>

                {isTime ? (
                  <div className="flex gap-2">
                    <select
                      className="w-1/2 p-2 border rounded-lg"
                      value={hour}
                      onChange={(e) => {
                        const newHour = parseInt(e.target.value);
                        const isPm = period === "PM";
                        let finalHour = isPm
                          ? newHour === 12
                            ? 12
                            : newHour + 12
                          : newHour === 12
                            ? 0
                            : newHour;
                        handleFieldChange(
                          key,
                          `${String(finalHour).padStart(2, "0")}:00`,
                        );
                      }}
                    >
                      {[...Array(12).keys()].map((i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>

                    <select
                      className="w-1/2 p-2 border rounded-lg"
                      value={period}
                      onChange={(e) => {
                        const newPeriod = e.target.value;
                        const isPm = newPeriod === "PM";
                        let finalHour = isPm
                          ? hour === 12
                            ? 12
                            : hour + 12
                          : hour === 12
                            ? 0
                            : hour;
                        handleFieldChange(
                          key,
                          `${String(finalHour).padStart(2, "0")}:00`,
                        );
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                ) : (
                  <input
                    type="number"
                    value={value}
                    min="0"
                    max="10"
                    step="0.5"
                    onChange={(e) =>
                      handleFieldChange(key, Number(e.target.value))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                  />
                )}
              </div>
            );
          })
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
            {successMsg}
          </p>
        )}
        <div className="flex justify-end">

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full  rounded-lg bg-[#ff6900] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto hover:cursor-pointer"
          >
          {saving ? "Saving..." : "Save Changes"}
        </button>
            </div>
      </form>
    </div>
  );
}
