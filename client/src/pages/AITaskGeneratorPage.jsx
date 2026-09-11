import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { projectService, aiService, taskService } from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  Sparkles,
  FolderKanban,
  CheckCircle2,
  Calendar,
  Clock,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sliders,
  Check,
  Edit3,
  Layers,
  Save,
  Info
} from "lucide-react";

const AITaskGeneratorPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Form inputs
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get("projectId") || "");
  const [goals, setGoals] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [taskCount, setTaskCount] = useState(5);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  // Suggestions state
  // Each suggestion: { id, title, description, priority, suggestedDueDate, estimatedDuration, selected: true }
  const [suggestions, setSuggestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectService.getProjects();
        if (res.success && res.data) {
          setProjects(res.data);
          if (!selectedProjectId && res.data.length > 0) {
            setSelectedProjectId(res.data[0].id);
          }
        }
      } catch (err) {
        addToast("Failed to fetch available projects", "error");
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [selectedProjectId, addToast]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      addToast("Please select a target project.", "warning");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    try {
      const selectedProj = projects.find((p) => p.id === selectedProjectId);
      const res = await aiService.generateTasks({
        projectId: selectedProjectId,
        projectName: selectedProj?.name,
        projectDescription: selectedProj?.description,
        goals: goals.trim() || undefined,
        additionalInstructions: additionalInstructions.trim() || undefined,
        taskCount: Number(taskCount)
      });

      if (res.success && res.data?.tasks) {
        const formatted = res.data.tasks.map((task, idx) => ({
          ...task,
          id: `ai-temp-${Date.now()}-${idx}`,
          selected: true,
          suggestedDueDate: task.suggestedDueDate ? task.suggestedDueDate.split("T")[0] : ""
        }));
        setSuggestions(formatted);
        addToast(`Generated ${formatted.length} AI suggestions! Review them below.`, "success");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "AI Task generation failed. Please ensure AI configuration is active.";
      setGenerationError(msg);
      addToast(msg, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelectAll = (select) => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: select })));
  };

  const toggleTaskSelection = (id) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleUpdateTaskField = (id, field, value) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleRemoveSuggestion = (id) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const selectedCount = suggestions.filter((s) => s.selected).length;

  const handleSaveSelectedTasks = async () => {
    const tasksToSave = suggestions.filter((s) => s.selected);
    if (tasksToSave.length === 0) {
      addToast("Please select at least one task suggestion to save.", "warning");
      return;
    }

    setIsSaving(true);
    let savedCount = 0;
    try {
      for (const item of tasksToSave) {
        await taskService.createTask({
          title: item.title,
          description: item.description,
          projectId: selectedProjectId,
          priority: item.priority,
          status: "todo",
          dueDate: item.suggestedDueDate ? new Date(item.suggestedDueDate).toISOString() : null
        });
        savedCount++;
      }

      addToast(`Successfully created ${savedCount} tasks in project!`, "success");
      setSuggestions([]);
      navigate(`/projects/${selectedProjectId}`);
    } catch (err) {
      addToast(
        `Saved ${savedCount} tasks, but encountered an error saving remaining tasks.`,
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F5F0] border border-[#B8EAD9] text-[#0F8B6D] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#0F8B6D]" />
              AI Sprint Architect
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2933] tracking-tight">
              AI Task Generator
            </h1>
            <p className="text-sm text-[#667085] mt-1.5 max-w-xl leading-relaxed">
              Describe your project milestones or feature scope, and our Gemini AI engine will generate actionable development tasks with estimates and priorities.
            </p>
          </div>
        </div>
      </div>

      {/* Generation Config Form */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E7E7E0] shadow-card">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-2">
                Target Project *
              </label>
              {loadingProjects ? (
                <div className="h-10 bg-[#F7F7F2] rounded-xl animate-pulse" />
              ) : projects.length === 0 ? (
                <div className="p-3 bg-[#FEF9F0] border border-[#FDF0D5] rounded-xl text-xs text-[#D97706]">
                  No projects found. Please{" "}
                  <Link to="/projects" className="underline font-bold">
                    create a project
                  </Link>{" "}
                  first.
                </div>
              ) : (
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Task Count Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933]">
                  Suggested Tasks Count
                </label>
                <span className="text-xs font-bold text-[#0F8B6D] bg-[#E8F5F0] px-2.5 py-0.5 rounded-full border border-[#B8EAD9]">
                  {taskCount} tasks
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={taskCount}
                onChange={(e) => setTaskCount(e.target.value)}
                className="w-full h-2 bg-[#E7E7E0] rounded-lg appearance-none cursor-pointer accent-[#0F8B6D] mt-2"
              />
              <div className="flex justify-between text-[11px] text-[#98A2B3] mt-1 font-medium">
                <span>1 task</span>
                <span>5 tasks</span>
                <span>10 tasks</span>
              </div>
            </div>
          </div>

          {/* Project Focus & Goals */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-2">
              Sprint Focus / Milestones
            </label>
            <input
              type="text"
              placeholder="e.g. Implement user authentication, role-based access control, and password recovery"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
            />
          </div>

          {/* Additional Guidance */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2933] mb-2">
              Specific Architectural Guidance or Constraints
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Use JWT stored in HTTP-Only cookies, write integration tests with Jest, ensure clean code separation..."
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] placeholder-[#98A2B3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white transition"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#E7E7E0]">
            <div className="flex items-center gap-1.5 text-xs text-[#667085]">
              <Info className="w-4 h-4 text-[#0F8B6D]" />
              <span>AI suggestions are previewed first and NOT automatically saved to database.</span>
            </div>

            <button
              type="submit"
              disabled={isGenerating || projects.length === 0}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Project & Generating Tasks...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Task Suggestions</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {generationError && (
        <div className="p-4 rounded-2xl bg-[#FDF2F2] border border-[#FDE2E2] text-[#C94C4C] text-sm flex items-start gap-3 shadow-subtle">
          <AlertCircle className="w-5 h-5 text-[#C94C4C] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#C94C4C]">AI Service Alert</p>
            <p className="mt-0.5">{generationError}</p>
          </div>
        </div>
      )}

      {/* Review & Edit AI Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#B8EAD9] shadow-card space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E0]">
            <div>
              <h2 className="text-xl font-bold text-[#1F2933] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0F8B6D]" />
                Review AI Task Suggestions ({suggestions.length})
              </h2>
              <p className="text-xs text-[#667085] mt-1">
                Customize titles, descriptions, and estimates. Only checked tasks will be added to your project.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSelectAll(true)}
                className="px-3 py-1.5 rounded-lg bg-[#F7F7F2] hover:bg-[#EFEFE9] text-xs font-semibold text-[#667085] hover:text-[#1F2933] border border-[#E7E7E0] transition"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                className="px-3 py-1.5 rounded-lg bg-[#F7F7F2] hover:bg-[#EFEFE9] text-xs font-semibold text-[#667085] hover:text-[#1F2933] border border-[#E7E7E0] transition"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {suggestions.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 sm:p-5 rounded-2xl border transition ${
                  item.selected
                    ? "bg-white border-[#B8EAD9] shadow-subtle"
                    : "bg-[#FAFAF7] border-[#E7E7E0] opacity-60"
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleTaskSelection(item.id)}
                    className="w-5 h-5 rounded bg-white border-[#D1D5DB] text-[#0F8B6D] focus:ring-[#0F8B6D] mt-1.5 cursor-pointer flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Editable Title */}
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateTaskField(item.id, "title", e.target.value)}
                      className="w-full px-3 sm:px-3.5 py-1.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#1F2933] font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white"
                    />

                    {/* Editable Description */}
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleUpdateTaskField(item.id, "description", e.target.value)}
                      className="w-full px-3 sm:px-3.5 py-1.5 bg-[#F7F7F2] border border-[#E7E7E0] rounded-xl text-[#667085] text-xs focus:outline-none focus:ring-2 focus:ring-[#0F8B6D] focus:bg-white"
                    />

                    {/* Metadata Row: Priority, Suggested Due Date, Estimated Duration */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[#667085] font-medium min-w-[70px] sm:min-w-0">Priority:</span>
                        <select
                          value={item.priority}
                          onChange={(e) => handleUpdateTaskField(item.id, "priority", e.target.value)}
                          className="flex-1 sm:flex-initial px-2.5 py-1 bg-[#F7F7F2] border border-[#E7E7E0] rounded-lg text-xs font-semibold text-[#1F2933]"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#667085] font-medium min-w-[70px] sm:min-w-0">Due Date:</span>
                        <input
                          type="date"
                          value={item.suggestedDueDate}
                          onChange={(e) => handleUpdateTaskField(item.id, "suggestedDueDate", e.target.value)}
                          className="flex-1 sm:flex-initial px-2.5 py-1 bg-[#F7F7F2] border border-[#E7E7E0] rounded-lg text-xs text-[#1F2933]"
                        />
                      </div>

                      {item.estimatedDuration && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F8B6D] bg-[#E8F5F0] px-2.5 py-1 rounded-full border border-[#B8EAD9] self-start sm:self-auto">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          Effort: {item.estimatedDuration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove Item Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSuggestion(item.id)}
                    className="p-1.5 text-[#98A2B3] hover:text-[#C94C4C] hover:bg-[#FDF2F2] rounded-lg transition flex-shrink-0"
                    title="Remove suggestion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Save Action Bar */}
          <div className="pt-4 border-t border-[#E7E7E0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm text-[#667085] font-medium text-center sm:text-left">
              Selected: <strong className="text-[#1F2933]">{selectedCount}</strong> of{" "}
              {suggestions.length} tasks ready for import
            </span>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSuggestions([])}
                className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#667085] hover:text-[#1F2933] bg-[#F7F7F2] hover:bg-[#EFEFE9] border border-[#E7E7E0] transition"
              >
                Discard All
              </button>
              <button
                type="button"
                disabled={selectedCount === 0 || isSaving}
                onClick={handleSaveSelectedTasks}
                className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0F8B6D] hover:bg-[#0B7057] shadow-subtle transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Selected Tasks ({selectedCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITaskGeneratorPage;
