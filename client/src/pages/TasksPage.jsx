import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { taskService, projectService, userService } from "../services/api";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/common/ConfirmModal";
import Badge from "../components/common/Badge";
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  Sparkles,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  FolderKanban,
  X
} from "lucide-react";

const TasksPage = () => {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: "",
    priority: "medium",
    status: "todo",
    dueDate: ""
  });
  const [modalLoading, setModalLoading] = useState(false);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.allSettled([
        taskService.getTasks(),
        projectService.getProjects(),
        userService.getUsers()
      ]);

      if (tasksRes.status === "fulfilled" && tasksRes.value?.success) {
        setTasks(tasksRes.value.data || []);
      } else if (tasksRes.status === "rejected") {
        setError(
          tasksRes.reason?.response?.data?.error?.message ||
          tasksRes.reason?.response?.data?.message ||
          "Failed to load tasks."
        );
      }

      if (projectsRes.status === "fulfilled" && projectsRes.value?.success) {
        const pList = projectsRes.value.data || [];
        setProjects(pList);
        if (pList.length > 0 && !formData.projectId) {
          setFormData((prev) => ({ ...prev, projectId: pList[0].id }));
        }
      }

      if (usersRes.status === "fulfilled" && usersRes.value?.success) {
        setUsers(usersRes.value.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to load tasks."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedTask(null);
    setFormData({
      title: "",
      description: "",
      projectId: projects[0]?.id || "",
      assignedTo: "",
      priority: "medium",
      status: "todo",
      dueDate: ""
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setModalMode("edit");
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      projectId: task.projectId,
      assignedTo: task.assignedTo || task.assignee?.id || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : ""
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.projectId) return;

    setModalLoading(true);
    try {
      const payload = {
        ...formData,
        assignedTo: formData.assignedTo || null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      };

      if (modalMode === "create") {
        await taskService.createTask(payload);
        addToast("Task created successfully!", "success");
      } else {
        await taskService.updateTask(selectedTask.id, payload);
        addToast("Task updated successfully!", "success");
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to save task.",
        "error"
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.patchTaskStatus(taskId, newStatus);
      addToast(`Status updated to ${newStatus}`, "success");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      addToast("Failed to update task status", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setDeleteLoading(true);
    try {
      await taskService.deleteTask(taskToDelete.id);
      addToast(`Task deleted.`, "success");
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to delete task.",
        "error"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter tasks in memory using combined conditions
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchesProject = projectFilter === "all" || t.projectId === projectFilter;

    let matchesOverdue = true;
    if (overdueOnly) {
      matchesOverdue = t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date();
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesOverdue;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2933] tracking-tight">
            Tasks
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Filter, prioritize, update statuses, and collaborate on project deliverables.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            to="/ai-generator"
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#0F8B6D] bg-[#E8F5F0] hover:bg-[#D4EFE6] border border-[#B8EAD9] transition shadow-subtle"
          >
            <Sparkles className="w-4 h-4 text-[#0F8B6D]" />
            AI Task Generator
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle transition"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Multi-Field Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E7E0] shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
            />
          </div>

          {/* Select Filters Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-xs font-semibold text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-xs font-semibold text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-xs font-semibold text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Quick toggles */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 pt-3 border-t border-[#E7E7E0] text-xs text-[#667085]">
          <label className="flex items-center gap-2 cursor-pointer hover:text-[#1F2933] select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded bg-[#F7F7F2] border-[#E7E7E0] text-[#0F8B6D] focus:ring-[#0F8B6D]"
            />
            <span className="font-medium">Show Overdue Only</span>
          </label>

          <span className="font-medium">Showing {filteredTasks.length} of {tasks.length} tasks</span>
        </div>
      </div>

      {/* Task List / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-[#0F8B6D] animate-spin" />
          <p className="text-sm text-[#667085]">Loading tasks...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-[#FDF2F2] border border-[#FDE2E2] text-center text-[#C94C4C] shadow-card">
          <AlertCircle className="w-8 h-8 text-[#C94C4C] mx-auto mb-2" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-dashed border-[#E7E7E0] shadow-subtle">
          <CheckSquare className="w-12 h-12 text-[#98A2B3] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1F2933]">No tasks found</h3>
          <p className="text-sm text-[#667085] mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, or create a new task.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-[#0F8B6D] hover:bg-[#0B7057] text-white text-xs font-semibold rounded-xl shadow-subtle transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isDone = task.status === "done";
            const isOverdue =
              !isDone && task.dueDate && new Date(task.dueDate) < new Date();

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 ${
                  isDone
                    ? "bg-[#FAFAF7] border-[#E7E7E0] opacity-80"
                    : isOverdue
                    ? "bg-[#FFFBFB] border-[#FDE2E2] hover:border-[#F87171] shadow-card"
                    : "bg-white border-[#E7E7E0] hover:border-[#B8EAD9] shadow-card hover:shadow-card-hover"
                }`}
              >
                {/* Left: Status Dropdown + Title + Meta */}
                <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className={`mt-0.5 px-2 py-1 sm:px-2.5 rounded-lg border text-[11px] sm:text-xs font-bold transition focus:outline-none flex-shrink-0 ${
                      task.status === "done"
                        ? "bg-[#E8F5F0] text-[#0F8B6D] border-[#B8EAD9]"
                        : task.status === "in-progress"
                        ? "bg-[#EAF6F5] text-[#2A9D8F] border-[#D5ECE9]"
                        : "bg-[#F7F7F2] text-[#667085] border-[#E7E7E0]"
                    }`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>

                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-sm sm:text-base font-bold tracking-tight transition break-words ${
                        isDone ? "text-[#98A2B3] line-through" : "text-[#1F2933]"
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-[#667085] mt-1 line-clamp-2 leading-relaxed break-words">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2.5 text-xs text-[#667085]">
                      {task.project && (
                        <Link
                          to={`/projects/${task.project.id}`}
                          className="flex items-center gap-1 text-[#0F8B6D] hover:text-[#0B7057] font-semibold truncate max-w-[180px] sm:max-w-xs"
                        >
                          <FolderKanban className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{task.project.name}</span>
                        </Link>
                      )}

                      {task.assignee ? (
                        <span className="flex items-center gap-1 text-[#667085]">
                          <User className="w-3.5 h-3.5 text-[#98A2B3] flex-shrink-0" />
                          <span className="truncate">{task.assignee.name}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#98A2B3] text-[11px]">
                          <User className="w-3.5 h-3.5 text-[#98A2B3] flex-shrink-0" />
                          <span>Unassigned</span>
                        </span>
                      )}

                      <Badge variant={task.priority} size="sm" dot>
                        {task.priority}
                      </Badge>

                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 text-[11px] ${
                            isOverdue
                              ? "text-[#C94C4C] font-bold"
                              : "text-[#667085]"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          {isOverdue ? "Overdue: " : "Due: "}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#E7E7E0]/60 w-full md:w-auto self-end md:self-center">
                  <button
                    onClick={() => handleOpenEditModal(task)}
                    className="p-2 text-[#98A2B3] hover:text-[#1F2933] hover:bg-[#F7F7F2] rounded-xl transition"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setTaskToDelete(task);
                      setDeleteModalOpen(true);
                    }}
                    className="p-2 text-[#98A2B3] hover:text-[#C94C4C] hover:bg-[#FDF2F2] rounded-xl transition"
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

      {/* Create / Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-[#E7E7E0] rounded-2xl shadow-modal p-5 sm:p-7 max-h-[90vh] overflow-y-auto my-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-[#98A2B3] hover:text-[#1F2933] p-1.5 rounded-lg hover:bg-[#F7F7F2] transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-[#1F2933] mb-5 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#0F8B6D]" />
              {modalMode === "create" ? "Create New Task" : "Edit Task"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement user permission authorization matrix"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                  Project *
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                >
                  <option value="" disabled>Select Target Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed criteria and deliverables..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                    Assignee (Optional)
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7E7E0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#667085] hover:text-[#1F2933] bg-[#F7F7F2] hover:bg-[#EFEFE9] rounded-xl border border-[#E7E7E0] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle rounded-xl transition disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modalMode === "create" ? "Create Task" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title={`Delete task '${taskToDelete?.title}'?`}
        message="Are you sure you want to permanently delete this task? This action cannot be undone."
        confirmText="Yes, Delete Task"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default TasksPage;
