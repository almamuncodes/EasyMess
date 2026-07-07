import dns from "node:dns/promises";
 dns.setServers(["1.1.1.1", "8.8.8.8"]);
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/navigation/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// app/layout.jsx

export const metadata = {
  metadataBase: new URL("https://easymess.vercel.app"),

  title: {
    default: "EasyMess",
    template: "%s | EasyMess",
  },

  description:
    "EasyMess is a smart meal management platform for hostels, messes, and shared living. Manage meals, members, expenses, and billing easily in one place.",

  keywords: [
    "EasyMess",
    "Meal Management",
    "Mess Management",
    "Hostel Management",
    "Meal Tracker",
    "Expense Management",
    "Bangladesh",
  ],

  authors: [
    {
      name: "Md Al Mamun",
    },
  ],

  creator: "Md Al Mamun",

  applicationName: "EasyMess",

  icons: {
    icon: "/logo.png",
  },

  openGraph: {
    title: "EasyMess",
    description:
      "Smart meal management platform for hostels and shared living.",
    url: "https://easymess.vercel.app",
    siteName: "EasyMess",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "EasyMess",
    description:
      "Smart meal management platform for hostels and shared living.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar/>
          <Toaster  position="top-left" />
        {children}
        
        </body>
    </html>
  );
}
