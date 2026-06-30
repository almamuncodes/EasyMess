"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use the hook directly to get session
  const { data: session, isPending } = authClient.useSession();

  const isLoggedIn = !!session; // Simple boolean check
  const role = session?.user?.role;

  // for pathname
  const pathname = usePathname();

  const publicMenu = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
  ];

  // Helper function to get menu based on role
  const getMenu = () => {
    if (!isLoggedIn) return publicMenu;

    // Common links for logged-in users
    const baseLinks = [
      { name: "Home", href: "/" },
      { name: "Dashboard", href: "/dashboard" },
    ];

    if (role === "member" || role === "manager") {
      return [
        { name: "Home", href: "/" },
        { name: "Notice ", href: "/notice" },
        { name: "Dashboard", href: "/dashboard" },
      ];
    }
    return baseLinks; // For Admin
  };

  const navLinks = getMenu();

  return (
    <nav className="w-full border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/image/easymess.png"
            alt="EasyMess"
            width={150}
            height={40}
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
      transition font-medium
      ${
        pathname === item.href
          ? "text-orange-500 border-b-2 border-orange-500 "
          : "text-gray-700 hover:text-orange-500"
      }
    `}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          {!isPending && ( // Wait for session to load
            <>
              {!isLoggedIn ? (
                <>
                  <Link
                    href="/signin"
                    className="px-5 py-2 rounded-full bg-orange-500 text-white font-medium"
                  >
                    Login
                  </Link>
                </>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="w-10 h-10 rounded-full overflow-hidden bg-orange-500 text-white font-bold flex items-center justify-center hover:cursor-pointer"
                  >
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      session?.user?.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </button>
                  {showProfile && (
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border overflow-hidden">
                      <Link
                        href="/profile"
                        className="block px-4 py-3 hover:bg-gray-50"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => authClient.signOut()}
                        className="w-full text-left px-4 py-3 text-red-500 hover:cursor-pointer hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 p-6 flex flex-col gap-4">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
  font-medium
  ${
    pathname === item.href
      ? "text-orange-500"
      : "text-gray-700 hover:text-orange-500"
  }
`}
            >
              {item.name}
            </Link>
          ))}

          {/* Mobile Menu for Login/Signup/Profile */}
          {!isPending && (
            <div className="pt-4 border-t flex flex-col gap-3">
              {!isLoggedIn ? (
                <>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-orange-500 text-white px-5 py-2 rounded-full text-center"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => authClient.signOut()}
                    className="text-red-500 text-left hover:cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
