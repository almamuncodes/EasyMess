import dns from "node:dns/promises";
 dns.setServers(["1.1.1.1", "8.8.8.8"]);
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/Fotter/Footer";
import ThemeProvider from "@/components/providers/ThemeProvider";
import SocketProvider from "@/components/providers/SocketProvider";

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

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }) {
  const isProd = process.env.NODE_ENV === "production";
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {isProd && gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        {isProd && clarityId && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityId}");
              `,
            }}
          />
        )}
        <ThemeProvider>
          <SocketProvider>
            <Navbar/>
            <Toaster  position="top-left" />
            {children}
            <Footer/>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

