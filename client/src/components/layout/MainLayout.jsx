import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#1F2933] flex flex-col font-sans overflow-x-hidden">
      <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <div className="flex flex-1 relative min-w-0 overflow-x-hidden">
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-1 md:pl-64 transition-all duration-300 w-full min-w-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
