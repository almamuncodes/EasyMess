export const metadata = {
  title: "About Us",
  description: "Learn more about EasyMess, a digital platform dedicated to simplifying and automating mess management for bachelors, students, and hostels.",
  keywords: ["About EasyMess", "Mess Management Software BD", "Hostel Meal Tracker Team"],
  alternatives: {
    canonical: "https://easymess.vercel.app/about",
  },
};

import { cookies } from "next/headers";
import AboutContent from "./AboutContent";

export default async function AboutPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "en";

  return <AboutContent lang={lang} />;
}
