import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Target,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ClipboardList,
  Activity,
  RefreshCw,
  Eye,
  XCircle,
  ShieldCheck,
  Check,
  X,
  FileText,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  UserCheck,
  History,
  Hourglass,
  Repeat,
  Send,
  MessageSquareWarning,
  ExternalLink,
  Plus,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

import {
  getTeamAllocations,
  getTasks,
  getMissions,
  updateTask,
  createTask,
  createEmployeeAllocation,
} from "../../utils/localStorage";
import { getTeams, getEmployees } from "../../data/hierarchy";
import { calculateExternalDelayMs } from "../../utils/scoringEngine";

const normalizeStatus = (status) => {
  const s = String(status || "").trim().toLowerCase();
  if (
    s === "pending verification" ||
    s === "submitted" ||
    s === "awaiting verification"
  ) {
    return "Pending Verification";
  }
  if (s === "completed" || s === "verified") return "Completed";
  if (s.includes("waiting") || s.includes("external"))
    return "Waiting External";
  if (s === "in progress" || s === "in_progress") return "In Progress";
  if (s === "rejected") return "Rejected";
  return "Pending";
};

const getEmployeeName = (task) => {
  return (
    task.employeeName ||
    task.assignedToName ||
    task.officer ||
    task.assignedTo ||
    "Unassigned Officer"
  );
};

const TeamDashboard = () => {
  const navigate = useNavigate();

  const [selectedTeamName, setSelectedTeamName] = useState(
    () => getTeams()[0]?.name || "Scholarship Verification Team"
  );
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [missions, setMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Verification & Audit Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [verifiedTargetInput, setVerifiedTargetInput] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Redistribution Modal
  const [taskToReassign, setTaskToReassign] = useState(null);
  const [reassignOfficerId, setReassignOfficerId] = useState("");

  // Task Assignment Modal (Phase D Spec)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    description: "",
    target: 50,
    deadline: "",
    priority: "High",
    complexity: "Medium",
    category: "Verification",
    employeeId: "",
  });

  const allEmployees = useMemo(() => getEmployees(), []);

  const allAvailableTeams = useMemo(() => {
    const list = getTeams().map((t) => ({
      ...t,
      lead: t.supervisor || t.lead || "Team Supervisor",
    }));
    try {
      const rawAlloc = getTeamAllocations() || [];
      rawAlloc.forEach((a) => {
        const tName = a.team || a.teamName;
        if (
          tName &&
          !list.some((t) => t.name.toLowerCase() === tName.toLowerCase())
        ) {
          list.push({
            name: tName,
            code: `TEAM-${list.length + 1}`,
            organization: a.organization || "General Agency",
            department: a.department || "General Department",
            lead: a.lead || "Team Supervisor",
          });
        }
      });
    } catch (e) {
      console.error(e);
    }
    return list;
  }, []);

  const activeTeam = useMemo(() => {
    return (
      allAvailableTeams.find(
        (t) => t.name.toLowerCase() === selectedTeamName.toLowerCase()
      ) ||
      allAvailableTeams[0] || {
        name: selectedTeamName,
        organization: "General Agency",
        department: "General Department",
        lead: "Team Supervisor",
      }
    );
  }, [allAvailableTeams, selectedTeamName]);

  const teamOfficers = useMemo(() => {
    const specific = allEmployees.filter(
      (e) => (e.team || "").toLowerCase() === activeTeam.name.toLowerCase()
    );
    return specific.length > 0 ? specific : allEmployees;
  }, [allEmployees, activeTeam]);

  const loadTeamData = () => {
    setRefreshing(true);
    try {
      const allAllocations = getTeamAllocations() || [];
      const filteredAllocations = allAllocations.filter(
        (a) =>
          (a.team || "").toLowerCase() === activeTeam.name.toLowerCase() ||
          (a.teamName || "").toLowerCase() === activeTeam.name.toLowerCase()
      );

      const allTasks = getTasks() || [];
      const teamTasks = allTasks.filter(
        (t) => (t.team || "").toLowerCase() === activeTeam.name.toLowerCase()
      );

      const allMissions = getMissions() || [];

      setTeamAllocations(filteredAllocations);
      setTasks(teamTasks);
      setMissions(allMissions);
    } catch (error) {
      console.error("Failed to load team data:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [selectedTeamName]);

  useEffect(() => {
    const handleUpdate = () => loadTeamData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [selectedTeamName]);

  const totalQuota = teamAllocations.reduce(
    (sum, a) => sum + Number(a.allocatedTarget || a.target || 0),
    0
  );
  const completedTasks = tasks.filter(
    (t) => normalizeStatus(t.status) === "Completed"
  ).length;
  const pendingVerificationCount = tasks.filter(
    (t) => normalizeStatus(t.status) === "Pending Verification"
  ).length;
  const inProgressCount = tasks.filter(
    (t) =>
      normalizeStatus(t.status) === "In Progress" ||
      normalizeStatus(t.status) === "Waiting External"
  ).length;
  const verifiedUnits = tasks
    .filter((t) => normalizeStatus(t.status) === "Completed")
    .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 0), 0);

  const teamEfficiency =
    totalQuota > 0
      ? Math.min(100, Math.round((verifiedUnits / totalQuota) * 100))
      : tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

  const openAuditModal = (task) => {
    setSelectedTask(task);
    setVerifiedTargetInput(String(task.target || 1));
    setRejectionNote("");
    setShowRejectBox(false);
  };

  const handleApprove = (task) => {
    try {
      const units = Number(verifiedTargetInput) || Number(task.target || 1);
      updateTask(task.id, {
        status: "Completed",
        verificationStatus: "Approved",
        verifiedByTeam: true,
        teamVerified: true,
        verifiedForOrganization: true,
        verifiedTarget: units,
        verifiedAt: new Date().toISOString(),
        changedBy: `Supervisor: ${activeTeam.lead}`,
      });
      setSelectedTask(null);
      loadTeamData();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert(
        `Task "${task.title || task.name}" verified and approved (${units} units)!`
      );
    } catch (err) {
      console.error("Failed to approve task:", err);
    }
  };

  const handleReject = (task) => {
    if (!rejectionNote.trim()) {
      window.alert("Please provide the rework reason for the officer.");
      return;
    }

    try {
      updateTask(task.id, {
        status: "Rejected",
        verificationStatus: "Rejected",
        rejectionReason: rejectionNote.trim(),
        verifiedByTeam: false,
        teamVerified: false,
        changedBy: `Supervisor: ${activeTeam.lead}`,
      });
      setSelectedTask(null);
      loadTeamData();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert(`Task returned to officer with rework note: ${rejectionNote}`);
    } catch (err) {
      console.error("Failed to reject task:", err);
    }
  };

  // Phase 4: Supervisor Task Redistribution Tool
  const handleReassign = (e) => {
    e.preventDefault();
    if (!taskToReassign || !reassignOfficerId) return;

    const newOfficer =
      teamOfficers.find((o) => o.id === reassignOfficerId) ||
      allEmployees.find((o) => o.id === reassignOfficerId);

    if (!newOfficer) return;

    try {
      updateTask(taskToReassign.id, {
        employeeId: newOfficer.id,
        employeeName: newOfficer.name,
        employee: newOfficer.name,
        employeeRole: newOfficer.role,
        changedBy: `Supervisor Redistribution (${activeTeam.lead})`,
        evidenceNotes: `Reassigned from ${getEmployeeName(taskToReassign)} to ${newOfficer.name}`,
      });

      setTaskToReassign(null);
      loadTeamData();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert(
        `Task deliverable redistributed to ${newOfficer.name} successfully!`
      );
    } catch (err) {
      console.error("Failed to reassign task:", err);
    }
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim() || !newTaskForm.employeeId) {
      window.alert("Please enter a task title and select an assigned officer.");
      return;
    }

    const assignedOfficer =
      teamOfficers.find((o) => o.id === newTaskForm.employeeId) ||
      allEmployees.find((o) => o.id === newTaskForm.employeeId);

    try {
      const created = createTask({
        title: newTaskForm.title.trim(),
        description: newTaskForm.description.trim(),
        target: Number(newTaskForm.target) || 50,
        deadline:
          newTaskForm.deadline ||
          new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        priority: newTaskForm.priority,
        complexity: newTaskForm.complexity,
        category: newTaskForm.category,
        employeeId: assignedOfficer?.id,
        employeeName: assignedOfficer?.name,
        employee: assignedOfficer?.name,
        team: activeTeam.name,
        organization: activeTeam.organization,
        department: activeTeam.department,
        status: "In Progress",
        verificationStatus: "Pending",
      });

      if (created) {
        setIsAssignModalOpen(false);
        setNewTaskForm({
          title: "",
          description: "",
          target: 50,
          deadline: "",
          priority: "High",
          complexity: "Medium",
          category: "Verification",
          employeeId: "",
        });
        loadTeamData();
        window.dispatchEvent(new Event("governscale-data-updated"));
        window.alert(`Deliverable successfully assigned to ${assignedOfficer?.name}!`);
      }
    } catch (err) {
      console.error("Failed to assign task:", err);
      window.alert("Failed to assign task.");
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      {/* HEADER WITH TEAM SELECTOR DROPDOWN */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#154B38]">
              {activeTeam.organization} • Phase 4 Verification & Execution Desk
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-400">
              Supervisor: {activeTeam.lead}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {activeTeam.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Frontline supervisor desk: audit officer deliverables, verify outcomes, and redistribute workloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Team Switcher Dropdown Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Users size={14} className="text-[#154B38]" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">
              Team:
            </span>
            <select
              value={selectedTeamName}
              onChange={(e) => setSelectedTeamName(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer max-w-[200px] truncate"
            >
              {allAvailableTeams.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadTeamData}
            loading={refreshing}
            icon={<RefreshCw size={14} />}
          >
            Sync Live Queue
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            icon={<Plus size={14} />}
          >
            Assign Task
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/team/analytics")}
            icon={<BarChart3 size={14} />}
          >
            Analytics
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/team/missions")}
            icon={<Target size={14} />}
          >
            Team Directives
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Team Target Quota"
          value={totalQuota > 0 ? totalQuota.toLocaleString() : tasks.length}
          change={totalQuota > 0 ? "Cascaded from Org" : "Assigned tasks"}
        />
        <StatCard
          title="Verified Outputs"
          value={verifiedUnits.toLocaleString()}
          change={`${teamEfficiency}% quota achieved`}
          changeType="positive"
        />
        <StatCard
          title="Pending Verification"
          value={pendingVerificationCount}
          change={
            pendingVerificationCount > 0
              ? "Requires supervisor sign-off"
              : "All submissions audited"
          }
          changeType={pendingVerificationCount > 0 ? "warning" : "positive"}
        />
        <StatCard
          title="In Progress / Active"
          value={inProgressCount}
          change="Officer execution queue"
          changeType="neutral"
        />
      </div>

      {/* DELIVERABLES & VERIFICATION AUDIT TABLE */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Team Deliverable & Verification Queue ({tasks.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect deliverable evidence notes, verify targets, or redistribute workloads.
            </p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-[#F4F6F8]/60 p-12 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-[#154B38]" />
            <h3 className="text-sm font-bold text-slate-800">
              No tasks currently dispatched
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Go to Team Directives to assign deliverable tasks to team officers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  <th className="pb-3 pr-4">Task Deliverable</th>
                  <th className="pb-3 px-4">Assigned Officer</th>
                  <th className="pb-3 px-4">Category & Complexity</th>
                  <th className="pb-3 px-4">Due Date</th>
                  <th className="pb-3 px-4">Target / Verified</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {tasks.map((t, idx) => {
                  const statusNormalized = normalizeStatus(t.status);
                  const isPendingVerif = statusNormalized === "Pending Verification";
                  const isCompleted = statusNormalized === "Completed";
                  const isWaitingExt = statusNormalized === "Waiting External";
                  const isRejected = statusNormalized === "Rejected";

                  return (
                    <tr
                      key={t.id || idx}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3.5 pr-4">
                        <p className="font-bold text-slate-900">{t.title || t.name}</p>
                        {t.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-semibold">
                        {getEmployeeName(t)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-slate-700">
                            {t.category || "General"}
                          </span>
                          <span className="text-[10px] text-purple-700 font-semibold">
                            {t.complexity || "Medium"} (2.0x)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {t.dueDate || "Ongoing"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {t.verifiedTarget ? (
                          <span className="text-emerald-700">
                            {t.verifiedTarget} / {t.target || 1} units
                          </span>
                        ) : (
                          <span>{t.target || 1} units</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            isCompleted
                              ? "completed"
                              : isPendingVerif
                              ? "warning"
                              : isWaitingExt
                              ? "warning"
                              : isRejected
                              ? "danger"
                              : "default"
                          }
                        >
                          {statusNormalized}
                        </Badge>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={isPendingVerif ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => openAuditModal(t)}
                            icon={isPendingVerif ? <ShieldCheck size={13} /> : <Eye size={13} />}
                          >
                            {isPendingVerif ? "Audit & Verify" : "View"}
                          </Button>

                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                setTaskToReassign(t);
                                if (teamOfficers.length > 0) {
                                  setReassignOfficerId(teamOfficers[0].id);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                              title="Redistribute Task to Another Officer"
                            >
                              <Repeat size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 1. SUPERVISOR VERIFICATION & AUDIT MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#154B38]">
                  Phase 4 • Deliverable Audit & Verification
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedTask.title || selectedTask.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Officer</span>
                  <p className="font-bold text-slate-900 mt-0.5">{getEmployeeName(selectedTask)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Complexity</span>
                  <p className="font-bold text-purple-700 mt-0.5">{selectedTask.complexity || "Medium"} (2.0x)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                  <div>
                    <Badge variant="sage" className="mt-0.5">
                      {normalizeStatus(selectedTask.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Deliverable Evidence Review */}
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Submitted Deliverable Evidence:
                </span>
                <div className="p-3 bg-white rounded-xl border border-slate-200/90 text-slate-800 leading-relaxed font-medium">
                  {selectedTask.evidenceNotes || "No specific evidence text provided."}
                  {selectedTask.evidenceUrl && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-[#154B38] font-bold">
                      <ExternalLink size={13} />
                      <a
                        href={selectedTask.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {selectedTask.evidenceUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Verified Units Input for Approvals */}
              {normalizeStatus(selectedTask.status) === "Pending Verification" && (
                <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80">
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Verified Volume Units to Credit:
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedTask.target}
                    value={verifiedTargetInput}
                    onChange={(e) => setVerifiedTargetInput(e.target.value)}
                    placeholder={`Max: ${selectedTask.target}`}
                    required
                  />
                  <p className="text-[10px] text-emerald-700 mt-1 font-semibold">
                    Target Quota: {selectedTask.target} units. Full credit will grant 100% Volume score.
                  </p>
                </div>
              )}

              {/* Structured Reject Box */}
              {showRejectBox && (
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 animate-in fade-in">
                  <label className="block text-xs font-bold text-rose-900 mb-1">
                    Rework Instructions / Rejection Reason: <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Specify incomplete credentials, missing certificates, or audit discrepancies..."
                    className="w-full rounded-xl border border-rose-200 bg-white p-2.5 text-xs text-rose-900 focus:outline-none"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowRejectBox(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(selectedTask)}
                    >
                      Confirm Return for Rework
                    </Button>
                  </div>
                </div>
              )}

              {/* Timestamped Status Log */}
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">
                  Timestamped Audit Trail ({selectedTask.statusLog?.length || 1} Events)
                </span>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {(selectedTask.statusLog || [
                    {
                      from: null,
                      to: selectedTask.status || "Pending",
                      timestamp: selectedTask.createdAt,
                      changedBy: "System",
                    },
                  ]).map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#F8FAFC] rounded-lg border border-slate-100 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-[#154B38]">
                          {entry.from ? `${entry.from} → ` : "Created: "}
                          {entry.to}
                        </span>
                        <span className="text-slate-400 ml-2">by {entry.changedBy}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTask(null)}>
                Close
              </Button>

              {normalizeStatus(selectedTask.status) === "Pending Verification" && !showRejectBox && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowRejectBox(true)}
                  >
                    Return for Rework
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(selectedTask)}
                    icon={<Check size={14} />}
                  >
                    Approve & Sign Off
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. SUPERVISOR TASK REDISTRIBUTION MODAL (SPEC TOOL) */}
      {taskToReassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#154B38]">
                  Workload Balancing Tool
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Redistribute Task
                </h3>
              </div>
              <button
                onClick={() => setTaskToReassign(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReassign} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Task Deliverable:
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {taskToReassign.title || taskToReassign.name} ({taskToReassign.target} units)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Currently assigned to: <b>{getEmployeeName(taskToReassign)}</b>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reassign to Officer:
                </label>
                <select
                  value={reassignOfficerId}
                  onChange={(e) => setReassignOfficerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-900 focus:border-[#154B38] focus:outline-none"
                >
                  {teamOfficers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                ℹ️ Reassigning this task will transfer the deliverable target quota and record a supervisor reassignment event in the task's timestamped audit log.
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setTaskToReassign(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={<Send size={14} />}
                >
                  Confirm Reassignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TASK ASSIGNMENT MODAL (PHASE D SPEC) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EBF6F0] text-[#154B38]">
                  <Plus size={16} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Assign Task Deliverable
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeTeam.name} • Direct Officer Workload Allocation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Deliverable Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={newTaskForm.title}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, title: e.target.value })
                  }
                  placeholder="e.g. Verify District Income Certificates"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTaskForm.description}
                  onChange={(e) =>
                    setNewTaskForm({
                      ...newTaskForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Detailed verification requirements, guidelines, or scope..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 focus:border-[#154B38] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Assigned Officer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTaskForm.employeeId}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        employeeId: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:border-[#154B38] focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Select Officer --</option>
                    {teamOfficers.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Target Quota Units <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newTaskForm.target}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        target: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        priority: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-[#154B38] focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Complexity
                  </label>
                  <select
                    value={newTaskForm.complexity}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        complexity: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-[#154B38] focus:outline-none"
                  >
                    <option value="Low">Low (40 pt)</option>
                    <option value="Medium">Medium (70 pt)</option>
                    <option value="High">High (100 pt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newTaskForm.category}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-[#154B38] focus:outline-none"
                  >
                    <option value="Verification">Verification</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Processing">Processing</option>
                    <option value="Field Operation">Field Operation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Due Deadline
                </label>
                <Input
                  type="date"
                  value={newTaskForm.deadline}
                  onChange={(e) =>
                    setNewTaskForm({
                      ...newTaskForm,
                      deadline: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={<Plus size={14} />}
                >
                  Create & Assign
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeamDashboard;