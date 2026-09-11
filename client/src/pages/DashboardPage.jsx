import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Activity,
  ArrowRight,
  ListTodo,
  Calendar,
  Loader2,
  Plus
} from "lucide-react";

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getDashboard({ activityLimit: 8 });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to load dashboard metrics. Please check network connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#0F8B6D] animate-spin" />
        <p className="text-sm text-[#667085]">Loading your developer productivity metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-[#FDF2F2] border border-[#FDE2E2] text-[#C94C4C] max-w-2xl mx-auto my-8 text-center">
        <AlertCircle className="w-10 h-10 text-[#C94C4C] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#C94C4C] mb-1">Dashboard Error</h3>
        <p className="text-sm text-[#667085] mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-[#0F8B6D] hover:bg-[#0B7057] text-white rounded-xl text-sm font-semibold transition shadow-subtle"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { projects, tasks, recentActivities } = data || {
    projects: { total: 0, active: 0, completed: 0 },
    tasks: { total: 0, todo: 0, inProgress: 0, done: 0, progressPercentage: 0, overdue: 0, upcoming: 0, assignedToMe: { total: 0 } },
    recentActivities: []
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Welcome Card Banner */}
      <div className="rounded-2xl bg-white border border-[#E7E7E0] p-4 sm:p-6 lg:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F5F0] border border-[#B8EAD9] text-[#0F8B6D] mb-2.5 sm:mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#0F8B6D]" />
              Engineering Productivity Overview
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1F2933] tracking-tight">
              Welcome back, {user?.name || "Developer"}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1.5 max-w-xl leading-relaxed">
              Track project delivery, manage sprint tasks, and generate workflow action items with AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <Link
              to="/ai-generator"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle transition w-full sm:w-auto text-center"
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Generate Tasks with AI</span>
            </Link>
            <Link
              to="/projects"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#1F2933] bg-white hover:bg-[#F7F7F2] border border-[#E7E7E0] shadow-subtle transition w-full sm:w-auto text-center"
            >
              <Plus className="w-4 h-4 text-[#667085] flex-shrink-0" />
              <span>New Project</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {/* Total Projects Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E7E0] shadow-card flex flex-col justify-between hover:border-[#CBD5E1] transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#98A2B3]">
              Total Projects
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#E8F5F0] border border-[#B8EAD9] flex items-center justify-center text-[#0F8B6D]">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#1F2933]">{projects.total}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#667085]">
              <span className="text-[#0F8B6D] font-semibold">{projects.active} active</span>
              <span>•</span>
              <span>{projects.completed} completed</span>
            </div>
          </div>
        </div>

        {/* Total Tasks Card with Progress */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E7E0] shadow-card flex flex-col justify-between hover:border-[#CBD5E1] transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#98A2B3]">
              Total Tasks
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EAF6F5] border border-[#D5ECE9] flex items-center justify-center text-[#2A9D8F]">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#1F2933]">{tasks.total}</span>
              <span className="text-xs font-bold text-[#0F8B6D] bg-[#E8F5F0] px-2 py-0.5 rounded-full border border-[#B8EAD9]">
                {tasks.progressPercentage}% done
              </span>
            </div>
            {/* Thin Emerald Progress Bar */}
            <div className="w-full bg-[#E8F5F0] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#0F8B6D] h-full rounded-full transition-all duration-500"
                style={{ width: `${tasks.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Assigned to Me Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E7E0] shadow-card flex flex-col justify-between hover:border-[#CBD5E1] transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#98A2B3]">
              Assigned to Me
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#E8F5F0] border border-[#B8EAD9] flex items-center justify-center text-[#0F8B6D]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#1F2933]">
              {tasks.assignedToMe?.total || 0}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#667085]">
              <span className="text-[#2A9D8F] font-semibold">{tasks.assignedToMe?.inProgress || 0} in-progress</span>
              <span>•</span>
              <span className="text-[#0F8B6D] font-semibold">{tasks.assignedToMe?.done || 0} done</span>
            </div>
          </div>
        </div>

        {/* Schedule Health */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E7E0] shadow-card flex flex-col justify-between hover:border-[#CBD5E1] transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#98A2B3]">
              Schedule Health
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FEF9F0] border border-[#FDF0D5] flex items-center justify-center text-[#D97706]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-2xl font-extrabold text-[#C94C4C]">{tasks.overdue || 0}</span>
                <p className="text-[11px] text-[#C94C4C] font-semibold">Overdue</p>
              </div>
              <div className="w-px h-8 bg-[#E7E7E0]" />
              <div>
                <span className="text-2xl font-extrabold text-[#D97706]">{tasks.upcoming || 0}</span>
                <p className="text-[11px] text-[#D97706] font-semibold">Due in 7 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Section: Status Distribution & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Overview */}
        <div className="p-6 rounded-2xl bg-white border border-[#E7E7E0] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#1F2933] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0F8B6D]" />
                Task Status Breakdown
              </h3>
              <Link
                to="/tasks"
                className="text-xs text-[#0F8B6D] hover:text-[#0B7057] font-semibold flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E7E0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#98A2B3]" />
                  <span className="text-sm font-semibold text-[#1F2933]">To Do</span>
                </div>
                <span className="text-sm font-bold text-[#1F2933]">{tasks.todo || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E7E0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#2A9D8F]" />
                  <span className="text-sm font-semibold text-[#1F2933]">In Progress</span>
                </div>
                <span className="text-sm font-bold text-[#1F2933]">{tasks.inProgress || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E7E0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#0F8B6D]" />
                  <span className="text-sm font-semibold text-[#1F2933]">Completed</span>
                </div>
                <span className="text-sm font-bold text-[#0F8B6D]">{tasks.done || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E7E7E0]">
            <Link
              to="/ai-generator"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#0F8B6D] bg-[#E8F5F0] border border-[#B8EAD9] hover:bg-[#D4EFE6] transition"
            >
              <Sparkles className="w-4 h-4" />
              Need new tasks? Generate with AI
            </Link>
          </div>
        </div>

        {/* Recent Activities Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-[#1F2933] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0F8B6D]" />
              Recent Workspace Activities
            </h3>
            <span className="text-xs text-[#98A2B3] font-medium">Live Audit Trail</span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-12 text-[#98A2B3]">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-[#667085]">No recent activities found.</p>
              <p className="text-xs text-[#98A2B3] mt-1">
                Create a project or task to begin populating the audit log.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#FAFAF7] hover:bg-[#F7F7F2] border border-[#E7E7E0] transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#E8F5F0] border border-[#B8EAD9] flex items-center justify-center text-[#0F8B6D] flex-shrink-0 mt-0.5">
                    {act.action.includes("AI") ? (
                      <Sparkles className="w-4 h-4" />
                    ) : act.action.includes("TASK") ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <FolderKanban className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1F2933] font-medium leading-snug">
                      {act.details}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#667085]">
                      <span>By <strong className="text-[#1F2933]">{act.user?.name || "System"}</strong></span>
                      {act.project && (
                        <>
                          <span>•</span>
                          <span className="text-[#0F8B6D] font-medium">{act.project.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-[#98A2B3]">{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
