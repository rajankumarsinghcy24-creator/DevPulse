import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#E8F5F0] border border-[#B8EAD9] flex items-center justify-center text-[#0F8B6D] mb-6 shadow-subtle">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-[#1F2933] tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-[#1F2933] mt-2">Page Not Found</h2>
      <p className="text-sm text-[#667085] mt-1 max-w-sm">
        The route you are trying to access does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
