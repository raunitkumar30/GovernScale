import React, { useEffect, useMemo, useState } from "react";
import {
  Target,
  CalendarDays,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
  X,
  ArrowUpRight,
  TrendingUp,
  Edit2,
  Network,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

import {
  getMissions,
  getTasks,
  deleteMission,
  updateMission,
  getDepartmentAllocations,
} from "../../utils/localStorage";

const MissionManagement = () => {
  const navigate = useNavigate();

  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [departmentAllocations, setDepartmentAllocations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // View / Edit Modal State
  const [viewingMission, setViewingMission] = useState(null);
  const [editingMission, setEditingMission] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "Medium",
    status: "Active",
    target: "",
  });

  const loadMissions = () => {
    setLoading(true);
    try {
      const storedMissions = getMissions();
      const storedTasks = getTasks();
      const storedDeptAlloc = getDepartmentAllocations();
      setMissions(Array.isArray(storedMissions) ? storedMissions : []);
      setTasks(Array.isArray(storedTasks) ? storedTasks : []);
      setDepartmentAllocations(Array.isArray(storedDeptAlloc) ? storedDeptAlloc : []);
    } catch (error) {
      console.error("Failed to load missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMissions = () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const storedMissions = getMissions();
      const storedTasks = getTasks();
      const storedDeptAlloc = getDepartmentAllocations();
      setMissions(Array.isArray(storedMissions) ? storedMissions : []);
      setTasks(Array.isArray(storedTasks) ? storedTasks : []);
      setDepartmentAllocations(Array.isArray(storedDeptAlloc) ? storedDeptAlloc : []);
    } catch (error) {
      console.error("Failed to refresh missions:", error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 400);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    const handleUpdate = () => loadMissions();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, []);

  const filteredMissions = useMemo(() => {
    return missions.filter((mission) => {
      const searchText = search.toLowerCase().trim();
      const matchesSearch =
        !searchText ||
        mission.title?.toLowerCase().includes(searchText) ||
        mission.description?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || mission.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || mission.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [missions, search, statusFilter, priorityFilter]);

  const totalMissions = missions.length;
  const activeMissions = missions.filter((m) => m.status === "Active").length;
  const completedMissions = missions.filter((m) => m.status === "Completed").length;
  const highPriorityMissions = missions.filter(
    (m) => m.priority === "High" || m.priority === "Critical"
  ).length;

  const handleDelete = (mission) => {
    const confirmed = window.confirm(
      `Delete "${mission.title}"?\n\nThis will permanently remove this mission and its department cascades.`
    );
    if (!confirmed) return;

    try {
      deleteMission(mission.id);
      loadMissions();
      window.dispatchEvent(new Event("governscale-data-updated"));
    } catch (error) {
      console.error("Failed to delete mission:", error);
      window.alert("Failed to delete mission.");
    }
  };

  const openEditModal = (mission) => {
    setEditingMission(mission);
    setEditFormData({
      title: mission.title || "",
      description: mission.description || "",
      deadline: mission.deadline || "",
      priority: mission.priority || "Medium",
      status: mission.status || "Active",
      target: mission.target || "",
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingMission) return;
    try {
      updateMission(editingMission.id, {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        deadline: editFormData.deadline,
        priority: editFormData.priority,
        status: editFormData.status,
        target: Number(editFormData.target) || editingMission.target,
      });
      setEditingMission(null);
      loadMissions();
      window.dispatchEvent(new Event("governscale-data-updated"));
    } catch (err) {
      console.error("Failed to update mission:", err);
      alert("Failed to save changes.");
    }
  };

  return (
    <DashboardLayout>
      {/* 1. PAGE HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Phase 2 • State Directives
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Government Mission Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Define, monitor, and manage root government missions cascading across departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshMissions}
            loading={refreshing}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/government/missions/cascade")}
            icon={<Network size={14} />}
          >
            View Cascade Tree
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/government/missions/create")}
            icon={<Plus size={15} />}
          >
            Create Mission
          </Button>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Total State Missions"
          value={totalMissions}
          change={totalMissions > 0 ? "Active state directives" : "No missions created"}
          onAction={() => navigate("/government/missions/create")}
          actionLabel="Add Directive"
        />

        <StatCard
          title="Active Directives"
          value={activeMissions}
          change={activeMissions > 0 ? "Under department execution" : "No running missions"}
          changeType={activeMissions > 0 ? "positive" : "neutral"}
        />

        <StatCard
          title="High Priority"
          value={highPriorityMissions}
          change={highPriorityMissions > 0 ? "Requires close SLA tracking" : "Normal priority"}
          changeType={highPriorityMissions > 0 ? "negative" : "neutral"}
        />

        <StatCard
          title="Completed Missions"
          value={completedMissions}
          change={
            totalMissions > 0
              ? `${Math.round((completedMissions / totalMissions) * 100)}% completion rate`
              : "0% completion"
          }
          changeType={completedMissions > 0 ? "positive" : "neutral"}
        />
      </div>

      {/* 3. SEARCH & FILTER BAR */}
      <Card className="mb-7 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by mission title or description..."
              className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                {["All", "Active", "Completed", "Pending", "Draft"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                {["All", "Critical", "High", "Medium", "Low"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. MISSION CARDS LIST */}
      {filteredMissions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#154B38] mb-4">
            <Target size={28} />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            No Government Missions Found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Create your first strategic government directive to begin cascading targets across departments.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate("/government/missions/create")}
              icon={<Plus size={16} />}
            >
              Create First Mission
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredMissions.map((mission) => {
            const departments = Array.isArray(mission.departments) ? mission.departments : [];
            const missionTarget = Number(mission.target || 0);

            const missionTasks = tasks.filter(
              (t) => String(t.missionId) === String(mission.id)
            );
            const verifiedUnits = missionTasks
              .filter((t) => String(t.status || "").toLowerCase() === "completed")
              .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
            const progress =
              missionTarget > 0
                ? Math.min(100, Math.round((verifiedUnits / missionTarget) * 100))
                : 0;
            const isFullyAchieved = missionTarget > 0 && verifiedUnits >= missionTarget;

            return (
              <div
                key={mission.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 card-soft-shadow hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge
                        variant={
                          isFullyAchieved || mission.status === "Completed"
                            ? "completed"
                            : mission.status === "Active"
                            ? "info"
                            : "warning"
                        }
                      >
                        {isFullyAchieved ? "Completed (100%)" : mission.status || "Active"}
                      </Badge>

                      <Badge
                        variant={
                          mission.priority === "Critical" || mission.priority === "High"
                            ? "danger"
                            : mission.priority === "Medium"
                            ? "warning"
                            : "default"
                        }
                      >
                        {mission.priority || "Medium"} Priority
                      </Badge>

                      {mission.deadline && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <CalendarDays size={12} />
                          <span>Due {mission.deadline}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {mission.title}
                    </h3>

                    {mission.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {mission.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setViewingMission(mission)}
                      icon={<Eye size={14} />}
                    >
                      Details
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(`/government/missions/cascade?missionId=${mission.id}`)
                      }
                      icon={<Network size={14} />}
                    >
                      Cascade
                    </Button>

                    <button
                      type="button"
                      onClick={() => openEditModal(mission)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                      title="Edit Mission"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(mission)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                      title="Delete Mission"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Verified Deliverable Progress</span>
                    <span className="font-bold text-slate-900">
                      {verifiedUnits.toLocaleString()} / {missionTarget.toLocaleString()} units ({progress}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFullyAchieved ? "bg-emerald-600" : "bg-[#154B38]"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Departments:</span>
                    {departments.length === 0 ? (
                      <span className="text-slate-500 font-semibold">Unassigned</span>
                    ) : (
                      departments.map((dept, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-[#EBF6F0] px-2.5 py-0.5 text-[11px] font-bold text-[#154B38]"
                        >
                          {dept}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-4 font-semibold text-slate-700">
                    <span>
                      Target:{" "}
                      <b className="text-slate-900 font-extrabold">
                        {missionTarget.toLocaleString()}
                      </b>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <Badge variant="info">Mission Details</Badge>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {viewingMission.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingMission(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Description</span>
                <p className="mt-0.5 text-slate-700 leading-relaxed font-medium">
                  {viewingMission.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Target</span>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {Number(viewingMission.target).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Priority</span>
                  <p className="font-bold text-slate-800">{viewingMission.priority}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Deadline</span>
                  <p className="font-bold text-slate-800">{viewingMission.deadline}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                  Cascaded Department Allocations
                </span>
                <div className="space-y-1.5">
                  {departmentAllocations
                    .filter((a) => String(a.missionId) === String(viewingMission.id))
                    .map((a) => (
                      <div
                        key={a.id}
                        className="flex justify-between items-center bg-[#F8FAFC] p-2.5 rounded-lg border border-slate-100 font-semibold"
                      >
                        <span className="text-slate-800">{a.department}</span>
                        <span className="text-[#154B38] font-bold">
                          {Number(a.allocatedTarget || a.target).toLocaleString()} units
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setViewingMission(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const mId = viewingMission.id;
                  setViewingMission(null);
                  navigate(`/government/missions/cascade?missionId=${mId}`);
                }}
                icon={<Network size={14} />}
              >
                Open Cascade Tree
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Edit State Mission
                </h3>
                <p className="text-xs text-slate-500">
                  Update directive parameters and status.
                </p>
              </div>
              <button
                onClick={() => setEditingMission(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 focus:border-[#154B38] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deadline
                  </label>
                  <Input
                    type="date"
                    value={editFormData.deadline}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, deadline: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, priority: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-[#154B38] focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-[#154B38] focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setEditingMission(null)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Check size={14} />}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MissionManagement;