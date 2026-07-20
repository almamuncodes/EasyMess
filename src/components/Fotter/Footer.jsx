import React from "react";

const Footer = () => {
  return (
    <footer
      style={{ background: "transparent" }}
      className="w-full pt-6 pb-24 md:pb-6 px-6 text-xs sm:text-sm border-t border-gray-250/30 dark:border-slate-800/40"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end md:items-center justify-between gap-3 text-right">
        {/* Copyright notice - Hidden on mobile, visible on desktop */}
        <div className="hidden md:block text-slate-500 dark:text-slate-400">
          EasyMess &copy; {new Date().getFullYear()}. All rights reserved.
        </div>
        
        {/* Developer Credit - Right aligned on mobile, right on desktop */}
        <p className="text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1 w-full md:w-auto text-right">
          Developed and maintained by{" "}
          <a
            href="https://www.facebook.com/mdalmamun.islam.7564"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 font-semibold"
          >
            MAMUN
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
