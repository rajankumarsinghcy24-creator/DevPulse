import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  Fingerprint,
  CheckCircle2,
  Sparkles
} from "lucide-react";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setLogoutLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "manager":
        return "bg-[#FEF9F0] text-[#D97706] border-[#FDF0D5]";
      case "designer":
        return "bg-[#FDF2F8] text-[#DB2777] border-[#FCE7F3]";
      default:
        return "bg-[#E8F5F0] text-[#0F8B6D] border-[#B8EAD9]";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto animate-fade-in">
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#E7E7E0]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F5F0] border border-[#B8EAD9] flex items-center justify-center text-[#0F8B6D] font-extrabold text-2xl shadow-subtle">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F2933] tracking-tight">{user?.name}</h1>
              <p className="text-sm text-[#667085] mt-0.5">{user?.email}</p>
              <span
                className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getRoleBadge(
                  user?.role
                )}`}
              >
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={() => setLogoutModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#C94C4C] hover:text-white bg-[#FDF2F2] hover:bg-[#C94C4C] border border-[#FDE2E2] rounded-xl transition shadow-subtle"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E7E7E0]">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#98A2B3] mb-1.5">
              <Mail className="w-3.5 h-3.5 text-[#0F8B6D]" />
              Verified Email
            </span>
            <p className="text-sm font-semibold text-[#1F2933]">{user?.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E7E7E0]">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#98A2B3] mb-1.5">
              <Shield className="w-3.5 h-3.5 text-[#2A9D8F]" />
              Assigned Role
            </span>
            <p className="text-sm font-semibold text-[#1F2933] capitalize">{user?.role}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E7E7E0] sm:col-span-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#98A2B3] mb-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-[#0F8B6D]" />
              Unique User ID (UUID)
            </span>
            <p className="text-xs font-mono text-[#1F2933] break-all">{user?.id}</p>
          </div>

          {user?.createdAt && (
            <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E7E7E0] sm:col-span-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#98A2B3] mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F8B6D]" />
                Member Since
              </span>
              <p className="text-sm font-semibold text-[#1F2933]">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            </div>
          )}
        </div>

        {/* Security / Architecture Card */}
        <div className="mt-8 p-5 rounded-2xl bg-[#E8F5F0] border border-[#B8EAD9]">
          <div className="flex items-center gap-2 text-[#0F8B6D] font-bold text-sm mb-1">
            <Sparkles className="w-4 h-4" />
            Security & Session
          </div>
          <p className="text-xs text-[#064032] leading-relaxed">
            Your session is secured using standard JSON Web Tokens (JWT) stored with HTTP-Only cookie protection and strict CORS origin validation. Passwords are never stored or transmitted in plain text.
          </p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        title="Sign Out of DevPulse"
        message="Are you sure you want to end your current session? You will need to log back in to access your projects and tasks."
        confirmText="Sign Out"
        confirmVariant="danger"
        loading={logoutLoading}
        onConfirm={handleLogoutConfirm}
        onClose={() => setLogoutModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
