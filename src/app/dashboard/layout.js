export const metadata = {
  title: "Dashboard",
  description: "EasyMess User Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

import React from "react";
import DashboardGuard from "./DashboardGuard";

const layout = ({ children }) => {
  return <DashboardGuard>{children}</DashboardGuard>;
};

export default layout;