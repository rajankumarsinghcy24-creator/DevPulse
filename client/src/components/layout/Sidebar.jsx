import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Sparkles,
  UserCircle,
  Activity,
  Layers,
  X
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", path: "/projects", icon: FolderKanban },
  { name: "Tasks", path: "/tasks", icon: CheckSquare },
  { name: "AI Task Generator", path: "/ai-generator", icon: Sparkles, badge: "AI" },
  { name: "My Profile", path: "/profile", icon: UserCircle }
];

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-50 w-64 max-w-[85vw] bg-white border-r border-[#E7E7E0] transition-transform duration-300 md:translate-x-0 flex flex-col justify-between overflow-y-auto ${
          mobileMenuOpen ? "translate-x-0 shadow-dropdown" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-5">
          {/* Workspace label & Mobile Close button */}
          <div className="flex items-center justify-between px-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
              Workspace
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-[#98A2B3] hover:text-[#1F2933] rounded-lg"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#E8F5F0] text-[#0F8B6D] font-semibold border border-[#B8EAD9]"
                          : "text-[#667085] hover:text-[#1F2933] hover:bg-[#F7F7F2]"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#0F8B6D] text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

          {/* Quick Platform Insight Card */}
          <div className="p-3.5 rounded-xl bg-[#F7F7F2] border border-[#E7E7E0]">
            <div className="flex items-center gap-2 text-[#0F8B6D] mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold">DevPulse Engine</span>
            </div>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              PostgreSQL schema & Gemini 3.6-Flash AI task assistance active.
            </p>
          </div>
        </div>

        {/* User profile section at the bottom */}
        {user && (
          <div className="p-4 border-t border-[#E7E7E0] bg-[#FAFAF7]">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition border border-transparent hover:border-[#E7E7E0]"
            >
              <div className="w-9 h-9 rounded-xl bg-[#E8F5F0] border border-[#B8EAD9] flex items-center justify-center text-[#0F8B6D] font-bold text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#1F2933] truncate">{user.name}</span>
                <span className="text-[11px] text-[#667085] capitalize truncate">{user.role}</span>
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
