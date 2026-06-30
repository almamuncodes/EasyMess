"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Users,
  Utensils,
  Receipt,
  Wallet,
  Settings,
  Store,
  Building,
  BarChart3,
  UserCog,
  ClipboardClock,
} from "lucide-react";
import { GetUser } from "@/components/action/action";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const user = GetUser();
  const userId = user?.user?.id;

  const fetchUser = async () => {
    const res = await fetch(`http://localhost:5000/api/member/role/${userId}`);
    const data = await res.json();
    setRole(data.role);

    return data;
  };
  fetchUser();

  const menuItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["member"],
    },
    {
      name: "Overview",
      href: "/manager-dashboard",
      icon: LayoutDashboard,
      roles: [ "manager"],
    },
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [ "admin"],
    },
    {
      name: "My Mess",
      href: "/manager-dashboard/my-mess",
      icon: Home,
      roles: [ "manager"],
    },
    {
      name: "My Mess",
      href: "/manager-dashboard/my-mess",
      icon: Home,
      roles: ["member"],
    },
    {
      name: "Meals",
      href: "/meals",
      icon: Utensils,
      roles: ["member"],
    },
    {
      name: "Bills",
      href: "/manager-dashboard/bills",
      icon: Receipt,
      roles: [ "manager"],
    },
    {
      name: "Bills",
      href: "//bills",
      icon: Receipt,
      roles: ["member"],
    },
    { name: "Members", href: "/manager-dashboard/members", icon: Users, roles: ["manager"] },
    { name: "Bazaar", href: "/manager-dashboard/bazaar", icon: Store, roles: ["manager"] },
    { name: "Payments", href: "/manager-dashboard/payments", icon: Wallet, roles: ["manager"] },
    { name: "pending-requests", href: "/dashboard/manager-dashboard/pending-requests", icon:  ClipboardClock, roles: ["manager"] },
    {
      name: "All Messes",
      href: "/admin/messes",
      icon: Building,
      roles: ["admin"],
    },
    {
      name: "Managers",
      href: "/admin/managers",
      icon: UserCog,
      roles: ["admin"],
    },
    { name: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      roles: ["admin"],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["member"],
    },
    {
      name: "Settings",
      href: "/manager-dashboard/settings",
      icon: Settings,
      roles: [ "manager"],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: [ "admin"],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  if (!role) {
    return (
      <p className="text-center
    text-gray-600
    text-xl
    font-semibold
    max-w-md
    mx-auto
    leading-relaxed
   
  ">
        Please create or join a mess first to access your dashboard
      </p>
    );
  }

  return (
    <>
      {/*  Horizontal Scrollable Menu */}
      <nav className="md:hidden flex overflow-x-auto w-full bg-white border-b border-gray-100 p-2 gap-2 scrollbar-hide">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 bg-gray-50"
              }`}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 p-6">
        <div className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4">
            {role ? `${role} Dashboard` : "Menu"}
          </h2>
        </div>
        <nav className="flex flex-col gap-1.5">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
