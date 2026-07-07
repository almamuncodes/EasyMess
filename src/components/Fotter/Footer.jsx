import React from "react";

const Footer = () => {
  return (
    <footer
      style={{ background: "transparent" }}
      className="relative w-full py-4 px-4 text-gray-500 text-sm"
    >
      <div className="hidden md:flex items-center justify-center">
        EasyMess &copy; {new Date().getFullYear()}. All rights reserved.
      </div>
      <p className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
        {" "}
        Developed and maintained by <span>  <a
        href="https://www.facebook.com/mdalmamun.islam.7564"
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-400 hover:text-gray-500"
      >
        MAMUN
      </a></span>
      </p>

    
    </footer>
  );
};

export default Footer;
