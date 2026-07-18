export const metadata = {
  title: "Dashboard",
  description: "EasyMess User Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

import React from "react";
import Sidebar, { Navigation } from "./DashboardSideBar";


const layout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">

      {/* Sidebar */}
      <aside className="w-full md:w-72 border-r dark:border-slate-800 bg-white dark:bg-slate-900">
        <Sidebar/>
      </aside>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 bg-gray-50 dark:bg-slate-950">
        {children}
      </main>

    </div>
  );
};

export default layout;