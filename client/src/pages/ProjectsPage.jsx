import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { projectService } from "../services/api";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  User,
  Tag,
  Calendar
} from "lucide-react";

const ProjectsPage = () => {
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", status: "active" });
  const [modalLoading, setModalLoading] = useState(false);

  // Confirm Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectService.getProjects();
      if (res.success && res.data) {
        setProjects(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedProject(null);
    setFormData({ name: "", description: "", status: "active" });
    setModalOpen(true);
  };

  const handleOpenEditModal = (project, e) => {
    e.stopPropagation();
    setModalMode("edit");
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status
    });
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (project, e) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setModalLoading(true);
    try {
      if (modalMode === "create") {
        await projectService.createProject(formData);
        addToast("Project created successfully!", "success");
      } else {
        await projectService.updateProject(selectedProject.id, formData);
        addToast("Project updated successfully!", "success");
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      addToast(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to save project.",
        "error"
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setDeleteLoading(true);
    try {
      await projectService.deleteProject(projectToDelete.id);
      addToast(`Project '${projectToDelete.name}' deleted.`, "success");
      setDeleteModalOpen(false);
      fetchProjects();
    } catch (err) {
      addToast(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to delete project.",
        "error"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered list based on search and status
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return "bg-[#E8F5F0] text-[#0F8B6D] border-[#B8EAD9]";
      case "completed":
        return "bg-[#EAF6F5] text-[#2A9D8F] border-[#D5ECE9]";
      case "archived":
        return "bg-[#F7F7F2] text-[#667085] border-[#E7E7E0]";
      default:
        return "bg-[#F7F7F2] text-[#667085] border-[#E7E7E0]";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1F2933] tracking-tight">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Organize, track progress, and manage tasks across all software initiatives.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            to="/ai-generator"
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#0F8B6D] bg-[#E8F5F0] hover:bg-[#D4EFE6] border border-[#B8EAD9] transition shadow-subtle w-full sm:w-auto text-center"
          >
            <Sparkles className="w-4 h-4 text-[#0F8B6D] flex-shrink-0" />
            <span>AI Task Generator</span>
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle transition w-full sm:w-auto text-center"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#667085] flex-shrink-0" />
          <span className="text-xs text-[#667085] font-semibold flex-shrink-0">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-xs font-semibold text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-[#0F8B6D] animate-spin" />
          <p className="text-sm text-[#667085]">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-[#FDF2F2] border border-[#FDE2E2] text-center text-[#C94C4C]">
          <AlertCircle className="w-8 h-8 text-[#C94C4C] mx-auto mb-2" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-dashed border-[#E7E7E0] shadow-subtle">
          <FolderKanban className="w-12 h-12 text-[#98A2B3] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1F2933]">No projects found</h3>
          <p className="text-sm text-[#667085] mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "all"
              ? "No projects match your active search or filters. Try adjusting them."
              : "Get started by creating your first software project."}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-[#0F8B6D] hover:bg-[#0B7057] text-white text-xs font-semibold rounded-xl shadow-subtle transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const taskStats = project.stats || {};
            const total = taskStats.totalTasks ?? taskStats.total ?? 0;
            const done = taskStats.completedTasks ?? taskStats.done ?? 0;
            const progress = taskStats.progress ?? 0;
            return (
              <div
                key={project.id}
                className="group relative rounded-2xl bg-white border border-[#E7E7E0] hover:border-[#B8EAD9] shadow-card hover:shadow-card-hover transition duration-200 flex flex-col justify-between p-6 overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEditModal(project, e)}
                        className="p-1.5 text-[#98A2B3] hover:text-[#1F2933] hover:bg-[#F7F7F2] rounded-lg transition"
                        title="Edit Project"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleOpenDeleteModal(project, e)}
                        className="p-1.5 text-[#98A2B3] hover:text-[#C94C4C] hover:bg-[#FDF2F2] rounded-lg transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Link to={`/projects/${project.id}`} className="block group-hover:text-[#0F8B6D] transition">
                    <h3 className="text-lg font-bold text-[#1F2933] tracking-tight mb-1.5 flex items-center gap-2">
                      {project.name}
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#0F8B6D]" />
                    </h3>
                  </Link>

                  <p className="text-sm text-[#667085] line-clamp-2 mb-4 leading-relaxed">
                    {project.description || "No project description provided."}
                  </p>

                  {/* Project Tag */}
                  <div className="flex items-center gap-1.5 mb-5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#667085] bg-[#F7F7F2] border border-[#E7E7E0] px-2 py-0.5 rounded-md">
                      <Tag className="w-3 h-3 text-[#98A2B3]" />
                      Engineering
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#667085] bg-[#F7F7F2] border border-[#E7E7E0] px-2 py-0.5 rounded-md">
                      Task 4
                    </span>
                  </div>
                </div>

                {/* Footer with Progress, Avatar and Due Date */}
                <div className="pt-4 border-t border-[#E7E7E0]">
                  <div className="flex items-center justify-between text-xs text-[#667085] mb-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F8B6D]" />
                      <span><strong>{done}</strong> of <strong>{total}</strong> tasks</span>
                    </span>
                    <span className="font-bold text-[#1F2933]">{progress}%</span>
                  </div>

                  {/* Thin Emerald Progress Bar */}
                  <div className="w-full bg-[#E8F5F0] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0F8B6D] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#E8F5F0] border border-[#B8EAD9] flex items-center justify-center text-[#0F8B6D] font-bold text-[10px]">
                        {project.owner?.name ? project.owner.name.charAt(0).toUpperCase() : "M"}
                      </div>
                      <span className="text-xs text-[#667085]">
                        {project.owner?.name || "Me"}
                      </span>
                    </div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-xs font-semibold text-[#0F8B6D] hover:text-[#0B7057] flex items-center gap-1"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
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
              <FolderKanban className="w-5 h-5 text-[#0F8B6D]" />
              {modalMode === "create" ? "Create New Project" : "Edit Project"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Microservices Platform"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline project scope, objectives, and deliverables..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                />
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
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
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
                  {modalMode === "create" ? "Create Project" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title={`Delete Project '${projectToDelete?.name}'?`}
        message="Deleting this project will also permanently delete all associated tasks and activity records. This action cannot be undone."
        confirmText="Yes, Delete Project"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default ProjectsPage;
