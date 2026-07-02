// lib/api.js
// তোমার .env.local এ NEXT_PUBLIC_API_URL সেট করে দাও



// উদাহরণ: NEXT_PUBLIC_API_URL=http://localhost:5000


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function fetchOverview({ userId, month, year  }) {
  const url = `${API_BASE}/api/overview?userId=${userId}&month=${month}&year=${year}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load overview");
  }

  return data;
}