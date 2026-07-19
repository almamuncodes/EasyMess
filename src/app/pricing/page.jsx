export const metadata = {
  title: "Pricing",
  description: "Affordable subscription pricing plans for EasyMess: perfect for bachelor messes, student hostels, and shared apartment communities.",
  keywords: ["Mess Management Pricing", "EasyMess Plans", "Hostel Billing App Cost"],
  alternatives: {
    canonical: "https://easymess.vercel.app/pricing",
  },
};

import { cookies } from "next/headers";
import PricingContent from "./PricingContent";

export default async function PricingPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "en";

  return <PricingContent lang={lang} />;
}
