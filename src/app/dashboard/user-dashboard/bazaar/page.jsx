"use client";

import { GetUser } from "@/components/action/action";
import { useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function BazaarHistory() {
  const [bazaars, setBazaars] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const user = GetUser();
  const userId = user?.user?.id;

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const fetchBazaars = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bazaars/user/${userId}?month=${month}&year=${year}`,
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to load bazaar history");
        setBazaars([]);
        setGrandTotal(0);
        return;
      }

      setBazaars(data.data);
      setGrandTotal(data.grandTotal);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId, month, year]);

  useEffect(() => {
    fetchBazaars();
  }, [fetchBazaars]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-[#F2F4F1] border rounded-2xl shadow">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        🛒 Bazaar History
      </h1>

      {/* Filter */}
      <div className="flex gap-3 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {monthNames.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Grand Total */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex justify-between items-center">
        <span className="text-gray-600 font-medium">
          Total Bazaar ({monthNames[month - 1]})
        </span>
        <span className="text-xl font-bold text-blue-700">৳ {grandTotal}</span>
      </div>

      {/* States */}
      {loading && (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
        </div>
      )}
      {error && <p className="text-center text-red-500 py-4">{error}</p>}
      {!loading && !error && bazaars.length === 0 && (
        <p className="text-center text-gray-400 py-10">
          No bazaar entries found for this month.
        </p>
      )}

      {/* Bazaar List */}
      <div className="space-y-3">
        {bazaars.map((bazaar) => {
          const isOpen = expandedIds.has(bazaar._id);
          return (
            <div
              key={bazaar._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {/* Collapsed header - always visible */}
              <button
                type="button"
                onClick={() => toggleExpand(bazaar._id)}
                className="w-full flex justify-between items-start p-4 text-left"
              >
                <div>
                  <p className="text-sm text-gray-500">
                    {new Date(bazaar.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {bazaar.note && (
                    <p className="text-gray-700 font-medium">{bazaar.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">
                    ৳ {bazaar.totalAmount}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Expandable details */}
              <div
                className={`grid transition-all duration-200 ease-in-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-gray-100 px-4 pb-4 pt-2 space-y-1">
                    {bazaar.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-baseline gap-2 text-sm text-gray-600"
                      >
                        <span className="whitespace-nowrap">{item.title}</span>
                        <span className="flex-1 border-b border-dotted border-gray-300 mb-1"></span>
                        <span className="whitespace-nowrap">
                          ৳ {item.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
