export const metadata = {
  title: "Features",
  description: "Explore the core features of EasyMess: automatic meal tracking, bazaar expense log, deposit summary, and monthly bill reports.",
  keywords: ["Meal Management Features", "Mess Expense Tracker", "Mess Bill Calculator", "Hostel Software features"],
  alternatives: {
    canonical: "https://easymess.vercel.app/features",
  },
};

import { cookies } from "next/headers";
import FeaturesContent from "./FeaturesContent";

export default async function FeaturesPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "en";

  return <FeaturesContent lang={lang} />;
}
