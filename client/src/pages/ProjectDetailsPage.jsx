import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { projectService, taskService } from "../services/api";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/common/ConfirmModal";
import ProgressBar from "../components/common/ProgressBar";
import Badge from "../components/common/Badge";
import {
  FolderKanban,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Activity,
  CheckSquare,
  X
} from "lucide-react";

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Task Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: ""
  });
  const [taskModalLoading, setTaskModalLoading] = useState(false);

  // Delete Task Modal
  const [deleteTaskModalOpen, setDeleteTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteTaskLoading, setDeleteTaskLoading] = useState(false);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectService.getProject(id);
      if (res.success && res.data) {
        setProject(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to load project details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleOpenCreateTask = () => {
    setTaskModalMode("create");
    setSelectedTask(null);
    setTaskFormData({
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      dueDate: ""
    });
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setTaskModalMode("edit");
    setSelectedTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : ""
    });
    setTaskModalOpen(true);
  };

  const handleTaskFormSubmit = async (e) => {
    e.preventDefault();
    if (!taskFormData.title.trim()) return;

    setTaskModalLoading(true);
    try {
      if (taskModalMode === "create") {
        await taskService.createTask({
          ...taskFormData,
          projectId: id
        });
        addToast("Task created successfully!", "success");
      } else {
        await taskService.updateTask(selectedTask.id, taskFormData);
        addToast("Task updated successfully!", "success");
      }
      setTaskModalOpen(false);
      fetchProjectDetails();
    } catch (err) {
      addToast(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to save task.",
        "error"
      );
    } finally {
      setTaskModalLoading(false);
    }
  };

  const handleStatusToggle = async (task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await taskService.updateTaskStatus(task.id, newStatus);
      addToast(`Task marked as ${newStatus}`, "success");
      fetchProjectDetails();
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;
    setDeleteTaskLoading(true);
    try {
      await taskService.deleteTask(taskToDelete.id);
      addToast(`Task deleted`, "success");
      setDeleteTaskModalOpen(false);
      fetchProjectDetails();
    } catch (err) {
      addToast("Failed to delete task", "error");
    } finally {
      setDeleteTaskLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-[#0F8B6D] animate-spin" />
        <p className="text-sm text-[#667085]">Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 rounded-2xl bg-[#FDF2F2] border border-[#FDE2E2] text-center text-[#C94C4C] max-w-xl mx-auto my-12 shadow-card">
        <AlertCircle className="w-8 h-8 text-[#C94C4C] mx-auto mb-2" />
        <h3 className="text-base font-bold text-[#C94C4C]">Error Loading Project</h3>
        <p className="text-sm text-[#667085] mt-1 mb-4">{error || "Project not found."}</p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E7E7E0] hover:bg-[#F7F7F2] text-[#1F2933] rounded-xl text-xs font-semibold shadow-subtle transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  const { stats, tasks = [], activities = [] } = project;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-[#FDF2F2] text-[#C94C4C] border-[#FDE2E2]";
      case "medium":
        return "bg-[#FEF9F0] text-[#D97706] border-[#FDF0D5]";
      default:
        return "bg-[#EAF6F5] text-[#2A9D8F] border-[#D5ECE9]";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Back Button & Header */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#0F8B6D] mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-8 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-xl sm:text-3xl font-bold text-[#1F2933] tracking-tight">
                {project.name}
              </h1>
              <Badge variant={project.status} dot size="sm">
                {project.status}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#667085] max-w-2xl leading-relaxed">
              {project.description || "No description provided for this project."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <Link
              to={`/ai-generator?projectId=${project.id}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle transition"
            >
              <Sparkles className="w-4 h-4" />
              Generate Tasks with AI
            </Link>
            <button
              onClick={handleOpenCreateTask}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#1F2933] bg-white hover:bg-[#F7F7F2] border border-[#E7E7E0] shadow-subtle transition"
            >
              <Plus className="w-4 h-4 text-[#667085]" />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
          <span className="text-xs font-bold text-[#98A2B3] uppercase tracking-wider">
            Overall Progress
          </span>
          <div className="text-2xl font-bold text-[#1F2933] mt-1">{stats?.progress || 0}%</div>
          <ProgressBar
            progress={stats?.progress || 0}
            showLabel={false}
            showPercentage={false}
            size="sm"
            className="mt-2.5"
          />
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
          <span className="text-xs font-bold text-[#98A2B3] uppercase tracking-wider">
            Total Tasks
          </span>
          <div className="text-2xl font-bold text-[#1F2933] mt-1">{stats?.total || 0}</div>
          <p className="text-[11px] text-[#667085] mt-1">Total in initiative</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
          <span className="text-xs font-bold text-[#98A2B3] uppercase tracking-wider">
            In Progress
          </span>
          <div className="text-2xl font-bold text-[#2A9D8F] mt-1">{stats?.inProgress || 0}</div>
          <p className="text-[11px] text-[#667085] mt-1">Currently underway</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
          <span className="text-xs font-bold text-[#98A2B3] uppercase tracking-wider">
            Done
          </span>
          <div className="text-2xl font-bold text-[#0F8B6D] mt-1">{stats?.done || 0}</div>
          <p className="text-[11px] text-[#667085] mt-1">Successfully finished</p>
        </div>
      </div>

      {/* Tasks List Section */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#1F2933] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#0F8B6D]" />
              Project Tasks ({tasks.length})
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Manage, reassign, and track tasks belonging to this project.
            </p>
          </div>
          <button
            onClick={handleOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-[#98A2B3] border border-dashed border-[#E7E7E0] rounded-xl bg-[#FAFAF7]">
            <ListTodo className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#98A2B3]" />
            <p className="text-sm font-semibold text-[#667085]">No tasks in this project yet.</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={handleOpenCreateTask}
                className="px-3.5 py-1.5 bg-[#0F8B6D] hover:bg-[#0B7057] text-white rounded-xl text-xs font-semibold shadow-subtle transition"
              >
                Create Task Manually
              </button>
              <Link
                to={`/ai-generator?projectId=${project.id}`}
                className="px-3.5 py-1.5 bg-white hover:bg-[#F7F7F2] text-[#0F8B6D] border border-[#B8EAD9] rounded-xl text-xs font-semibold shadow-subtle transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0F8B6D]" /> Generate with AI
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isDone = task.status === "done";
              return (
                <div
                  key={task.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition ${
                    isDone
                      ? "bg-[#FAFAF7] border-[#E7E7E0] opacity-75"
                      : "bg-white border-[#E7E7E0] hover:border-[#B8EAD9] shadow-subtle"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleStatusToggle(task)}
                      className={`mt-0.5 p-1 rounded-lg border transition ${
                        isDone
                          ? "bg-[#0F8B6D] text-white border-[#0F8B6D]"
                          : "border-[#D1D5DB] hover:border-[#0F8B6D] text-transparent"
                      }`}
                      title="Toggle completion status"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div>
                      <h4
                        className={`text-sm font-bold transition ${
                          isDone ? "text-[#98A2B3] line-through" : "text-[#1F2933]"
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-[#667085] mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[#667085]">
                          Status: <strong className="text-[#1F2933]">{task.status}</strong>
                        </span>
                        {task.assignee && (
                          <span className="text-[#667085]">
                            • Assignee: <strong className="text-[#0F8B6D]">{task.assignee.name}</strong>
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[#667085]">
                            • <Calendar className="w-3 h-3 text-[#98A2B3]" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenEditTask(task)}
                      className="p-1.5 text-[#98A2B3] hover:text-[#1F2933] hover:bg-[#F7F7F2] rounded-lg transition"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setTaskToDelete(task);
                        setDeleteTaskModalOpen(true);
                      }}
                      className="p-1.5 text-[#98A2B3] hover:text-[#C94C4C] hover:bg-[#FDF2F2] rounded-lg transition"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Audit Trail */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
        <h3 className="text-lg font-bold text-[#1F2933] flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[#0F8B6D]" />
          Project Activity History
        </h3>

        {activities.length === 0 ? (
          <p className="text-xs text-[#98A2B3] py-4">No logged activities for this project.</p>
        ) : (
          <div className="space-y-2.5">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF7] border border-[#E7E7E0] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#0F8B6D]">{act.action}</span>
                  <span className="text-[#667085]">{act.details}</span>
                </div>
                <span className="text-[11px] text-[#98A2B3]">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Task Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-[#E7E7E0] rounded-2xl shadow-modal p-5 sm:p-7 max-h-[90vh] overflow-y-auto my-auto">
            <button
              onClick={() => setTaskModalOpen(false)}
              className="absolute top-4 right-4 text-[#98A2B3] hover:text-[#1F2933] p-1.5 rounded-lg hover:bg-[#F7F7F2] transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-[#1F2933] mb-5 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#0F8B6D]" />
              {taskModalMode === "create" ? "Add New Task" : "Edit Task"}
            </h3>

            <form onSubmit={handleTaskFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OAuth 2.0 PKCE flow"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Task steps and acceptance criteria..."
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                    Status
                  </label>
                  <select
                    value={taskFormData.status}
                    onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskFormData.dueDate}
                  onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7E7E0]">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#667085] hover:text-[#1F2933] bg-[#F7F7F2] hover:bg-[#EFEFE9] rounded-xl border border-[#E7E7E0] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskModalLoading}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle rounded-xl transition disabled:opacity-50"
                >
                  {taskModalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {taskModalMode === "create" ? "Create Task" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Modal */}
      <ConfirmModal
        isOpen={deleteTaskModalOpen}
        title={`Delete task '${taskToDelete?.title}'?`}
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Yes, Delete Task"
        confirmVariant="danger"
        loading={deleteTaskLoading}
        onConfirm={handleDeleteTaskConfirm}
        onClose={() => setDeleteTaskModalOpen(false)}
      />
    </div>
  );
};

export default ProjectDetailsPage;
