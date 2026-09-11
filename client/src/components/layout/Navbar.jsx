import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sparkles, LogOut, User, Menu, X, Search, Bell } from "lucide-react";

const Navbar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
    <header className="sticky top-0 z-30 bg-white border-b border-[#E7E7E0] shadow-subtle w-full">
      <div className="px-3 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* Left Section: Brand & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#667085] hover:text-[#1F2933] hover:bg-[#F7F7F2] transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8F5F0] border border-[#B8EAD9] flex items-center justify-center text-[#0F8B6D] group-hover:scale-105 transition-transform flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#1F2933]">
                DevPulse
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#0F8B6D] font-bold -mt-1 hidden xs:block">
                Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Center Section: Minimal Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, projects, or team activities..."
              className="w-full pl-10 pr-4 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-xs focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  navigate(`/tasks?search=${encodeURIComponent(e.target.value.trim())}`);
                }
              }}
            />
          </div>
        </div>

        {/* Right Section: Notifications, AI Quick Action, User Card & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Notifications Button */}
          <button
            type="button"
            title="Notifications"
            className="relative p-2 text-[#667085] hover:text-[#1F2933] hover:bg-[#F7F7F2] rounded-xl border border-transparent hover:border-[#E7E7E0] transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0F8B6D] ring-2 ring-white" />
          </button>

          {/* AI Task Generator Shortcut */}
          <Link
            to="/ai-generator"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E8F5F0] border border-[#B8EAD9] text-[#0F8B6D] hover:bg-[#D4EFE6] transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Generator
          </Link>

          {user && (
            <div className="flex items-center gap-2.5 pl-2.5 border-l border-[#E7E7E0]">
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F7F7F2] transition"
                title="View Profile"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E8F5F0] border border-[#B8EAD9] flex items-center justify-center text-[#0F8B6D] font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#1F2933]">{user.name}</span>
                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border self-start ${getRoleBadge(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-[#667085] hover:text-[#C94C4C] hover:bg-[#FDF2F2] rounded-xl border border-transparent hover:border-[#FDE2E2] transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
