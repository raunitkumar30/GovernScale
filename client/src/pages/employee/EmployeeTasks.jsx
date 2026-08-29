import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Play,
  Upload,
  RefreshCw,
  UserRound,
  Target,
  CalendarDays,
  FileCheck2,
  X,
  XCircle,
  MessageSquareWarning,
  Send,
  FileText,
  Link2,
  PauseCircle,
  History,
  Hourglass,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

import {
  getEmployeeTasksById,
  getEmployeeAllocationsByEmployee,
  updateTask,
} from "../../utils/localStorage";
import { getEmployees } from "../../data/hierarchy";
import { calculateExternalDelayMs } from "../../utils/scoringEngine";

const EmployeeTasks = () => {
  const EMPLOYEES = useMemo(() => getEmployees(), []);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    () => getEmployees()[0]?.id || "emp_001"
  );
  const [tasks, setTasks] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  // Modals State
  const [selectedTaskForEvidence, setSelectedTaskForEvidence] = useState(null);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const [selectedTaskForHold, setSelectedTaskForHold] = useState(null);
  const [externalDeptName, setExternalDeptName] = useState("Social Welfare Department");
  const [externalHoldReason, setExternalHoldReason] = useState("");

  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState(null);

  const selectedEmployee = useMemo(() => {
    return EMPLOYEES.find((e) => e.id === selectedEmployeeId) || EMPLOYEES[0];
  }, [EMPLOYEES, selectedEmployeeId]);

  const loadEmployeeData = () => {
    if (!selectedEmployeeId) return;
    try {
      const employeeTasks = getEmployeeTasksById(selectedEmployeeId) || [];
      const employeeAllocations =
        getEmployeeAllocationsByEmployee(selectedEmployeeId) || [];
      setTasks(employeeTasks);
      setAllocations(employeeAllocations);
    } catch (error) {
      console.error("Failed to load employee tasks:", error);
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, [selectedEmployeeId]);

  useEffect(() => {
    const handleUpdate = () => loadEmployeeData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [selectedEmployeeId]);

  const stats = useMemo(() => {
    const totalTarget = tasks.reduce((sum, t) => sum + Number(t.target || 1), 0);
    const completedTasks = tasks.filter(
      (t) => String(t.status).toLowerCase() === "completed"
    );
    const verifiedTarget = completedTasks.reduce(
      (sum, t) => sum + Number(t.verifiedTarget || t.target || 1),
      0
    );
    const pendingVerification = tasks.filter((t) =>
      ["pending verification", "submitted"].includes(String(t.status).toLowerCase())
    );
    const inProgress = tasks.filter(
      (t) => String(t.status).toLowerCase() === "in progress"
    );
    const waitingExternal = tasks.filter(
      (t) =>
        String(t.status).toLowerCase().includes("waiting") ||
        String(t.status).toLowerCase().includes("external")
    );
    const rejected = tasks.filter(
      (t) => String(t.status).toLowerCase() === "rejected"
    );

    const rate =
      totalTarget > 0
        ? Math.min(100, Math.round((verifiedTarget / totalTarget) * 100))
        : 0;

    return {
      totalTarget,
      verifiedTarget,
      pendingVerificationCount: pendingVerification.length,
      inProgressCount: inProgress.length,
      waitingExternalCount: waitingExternal.length,
      rejectedCount: rejected.length,
      completedCount: completedTasks.length,
      rate,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search ||
        (t.title || t.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.category || "").toLowerCase().includes(search.toLowerCase());

      const st = String(t.status || "").toLowerCase();
      let matchStatus = true;
      if (statusFilter === "Completed") matchStatus = st === "completed";
      else if (statusFilter === "In Progress") matchStatus = st === "in progress";
      else if (statusFilter === "Waiting External")
        matchStatus = st.includes("waiting") || st.includes("external");
      else if (statusFilter === "Pending Verification")
        matchStatus = ["pending verification", "submitted"].includes(st);
      else if (statusFilter === "Pending") matchStatus = st === "pending";
      else if (statusFilter === "Rejected") matchStatus = st === "rejected";

      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusFilter]);

  // Phase 4: Start task -> In Progress
  const handleStartTask = (task) => {
    try {
      updateTask(task.id, {
        status: "In Progress",
        startedAt: new Date().toISOString(),
        employeeName: selectedEmployee.name,
      });
      loadEmployeeData();
      window.dispatchEvent(new Event("governscale-data-updated"));
    } catch (err) {
      console.error("Failed to start task:", err);
    }
  };

  // Phase 4: Hold task -> Waiting for External Department
  const handleHoldExternal = (e) => {
    e.preventDefault();
    if (!selectedTaskForHold || !externalHoldReason.trim()) {
      window.alert("Please provide the reason or department dependency.");
      return;
    }

    try {
      updateTask(selectedTaskForHold.id, {
        status: "Waiting for External Department",
        externalDepartment: externalDeptName,
        externalHoldReason: externalHoldReason.trim(),
        employeeName: selectedEmployee.name,
      });
      setSelectedTaskForHold(null);
      setExternalHoldReason("");
      loadEmployeeData();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert(
        `Task placed on external hold with ${externalDeptName}. External delay time will be excluded from your timeliness SLA.`
      );
    } catch (err) {
      console.error("Failed to hold task:", err);
    }
  };

  // Phase 4: Resume task -> In Progress
  const handleResumeTask = (task) => {
    try {
      updateTask(task.id, {
        status: "In Progress",
        resumedAt: new Date().toISOString(),
        employeeName: selectedEmployee.name,
      });
      loadEmployeeData();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert("Task resumed! Working clock is now active.");
    } catch (err) {
      console.error("Failed to resume task:", err);
    }
  };

  // Phase 4: Submit Deliverable Evidence -> Pending Verification
  const handleSubmitEvidence = (e) => {
    e.preventDefault();
    if (!selectedTaskForEvidence || !evidenceNotes.trim()) {
      window.alert("Please provide notes or evidence documentation of your completed deliverable.");
      return;
    }

    try {
      updateTask(selectedTaskForEvidence.id, {
        status: "Pending Verification",
        verificationStatus: "Pending",
        evidenceNotes: evidenceNotes.trim(),
        evidenceUrl: evidenceUrl.trim(),
        submittedAt: new Date().toISOString(),
        employeeName: selectedEmployee.name,
      });

      setSelectedTaskForEvidence(null);
      setEvidenceNotes("");
      setEvidenceUrl("");
      loadEmployeeData();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert("Deliverable evidence submitted! Awaiting Team Supervisor verification.");
    } catch (err) {
      console.error("Submission failed:", err);
      window.alert("Failed to submit deliverable evidence.");
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
      {/* HEADER WITH OFFICER SELECTOR */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Phase 4 • Employee Work Execution
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Officer Deliverable Desk
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Execute assigned tasks, manage external department holds, and submit verified deliverable evidence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <UserRound size={14} className="text-[#154B38]" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">Officer:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              {EMPLOYEES.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadEmployeeData}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Assigned Target"
          value={stats.totalTarget.toLocaleString()}
          change="Required deliverables"
        />
        <StatCard
          title="Verified Outputs"
          value={stats.verifiedTarget.toLocaleString()}
          change={`${stats.rate}% target verified`}
          changeType="positive"
        />
        <StatCard
          title="In Progress / Active"
          value={stats.inProgressCount}
          change={
            stats.waitingExternalCount > 0
              ? `${stats.waitingExternalCount} on external hold`
              : "Active execution"
          }
          changeType={stats.inProgressCount > 0 ? "positive" : "neutral"}
        />
        <StatCard
          title="Pending Verification"
          value={stats.pendingVerificationCount}
          change="Under supervisor audit"
          changeType={stats.pendingVerificationCount > 0 ? "neutral" : "positive"}
        />
      </div>

      {/* SEARCH + FILTER */}
      <Card className="mb-7 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deliverables, categories, or descriptions..."
              className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 text-[11px] uppercase font-bold">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option value="All">All Deliverables</option>
                <option value="Pending">Pending Start</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting External">Waiting External Dept</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Completed">Completed & Verified</option>
                <option value="Rejected">Rejected / Rework</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* TASK LIST */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center card-soft-shadow">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-[#154B38]" />
            <h3 className="text-sm font-bold text-slate-800">No deliverables in this queue</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select another status filter or switch officer profile.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const st = String(task.status || "Pending").toLowerCase();
            const isPending = st === "pending";
            const isInProgress = st === "in progress";
            const isWaitingExternal = st.includes("waiting") || st.includes("external");
            const isPendingVerification =
              ["pending verification", "submitted"].includes(st);
            const isCompleted = st === "completed";
            const isRejected = st === "rejected";

            const externalDelayMs = calculateExternalDelayMs(task);
            const externalDelayDays = Math.round(
              externalDelayMs / (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={task.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge
                        variant={
                          isCompleted
                            ? "completed"
                            : isWaitingExternal
                            ? "warning"
                            : isInProgress
                            ? "info"
                            : isPendingVerification
                            ? "warning"
                            : isRejected
                            ? "danger"
                            : "default"
                        }
                      >
                        {task.status || "Pending"}
                      </Badge>

                      {task.complexity && (
                        <span className="rounded-full bg-purple-50 text-purple-700 px-2.5 py-0.5 text-[10px] font-extrabold border border-purple-200">
                          {task.complexity} Complexity
                        </span>
                      )}

                      {task.category && (
                        <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold">
                          {task.category}
                        </span>
                      )}

                      <Badge
                        variant={
                          task.priority === "Critical" || task.priority === "High"
                            ? "danger"
                            : "default"
                        }
                      >
                        {task.priority || "Medium"} Priority
                      </Badge>

                      <span className="text-xs text-slate-400 font-medium">
                        Due {task.dueDate || "Ongoing"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {task.title || task.name}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Waiting on external alert */}
                    {isWaitingExternal && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                        <Hourglass size={16} className="shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <p className="font-bold">
                            External Hold: {task.externalDepartment || "External Department"}
                          </p>
                          <p className="mt-0.5 text-amber-700">
                            {task.externalHoldReason || "Awaiting inter-department verification sign-off."}
                          </p>
                          <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                            ⚖️ Fair Scoring Active: External delay duration ({externalDelayDays} days) is excluded from timeliness deductions.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rejection Alert Notice */}
                    {isRejected && task.rejectionReason && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                        <MessageSquareWarning size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Returned for Rework by Supervisor:</p>
                          <p className="mt-0.5">{task.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Audit History Modal Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForHistory(task)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="View Timestamped Audit Trail"
                    >
                      <History size={14} className="text-[#154B38]" />
                      <span>Audit Trail</span>
                    </button>

                    {isPending && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartTask(task)}
                        icon={<Play size={13} />}
                      >
                        Start Task
                      </Button>
                    )}

                    {isInProgress && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedTaskForHold(task)}
                          icon={<PauseCircle size={13} />}
                        >
                          Waiting External
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedTaskForEvidence(task)}
                          icon={<Upload size={13} />}
                        >
                          Submit Evidence
                        </Button>
                      </>
                    )}

                    {isWaitingExternal && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResumeTask(task)}
                        icon={<Play size={13} />}
                      >
                        Resume Work
                      </Button>
                    )}

                    {isRejected && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedTaskForEvidence(task)}
                        icon={<Upload size={13} />}
                      >
                        Resubmit Evidence
                      </Button>
                    )}

                    {isPendingVerification && (
                      <Badge variant="warning" className="py-1.5 px-3">
                        Awaiting Verification
                      </Badge>
                    )}

                    {isCompleted && (
                      <Badge variant="completed" className="py-1.5 px-3">
                        Verified & Scored
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
                  <span>
                    Volume Quota: <b className="text-slate-900 font-extrabold">{task.target || 1} units</b>
                  </span>
                  <span>
                    Team: <b className="text-slate-800">{task.team || selectedEmployee.team}</b>
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 1. EVIDENCE SUBMISSION MODAL */}
      {selectedTaskForEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#154B38]">
                  Step 4 • Deliverable Submission
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Submit Deliverable Evidence
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskForEvidence(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Deliverable Target:
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedTaskForEvidence.title || selectedTaskForEvidence.name} (
                  {selectedTaskForEvidence.target} units)
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deliverable Verification Evidence & Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Detail completed application batches, credential verification serials, or operational metrics..."
                  required
                  className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-xs font-medium text-slate-900 outline-none focus:border-[#154B38] focus:ring-4 focus:ring-[#154B38]/10"
                />
              </div>

              <Input
                label="Evidence File Link / Document URL (Optional)"
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://eoffice.gov.in/records/doc-10492.pdf"
              />

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setSelectedTaskForEvidence(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={<Send size={14} />}
                >
                  Submit for Supervisor Verification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. WAITING FOR EXTERNAL DEPARTMENT MODAL */}
      {selectedTaskForHold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-700">
                  External Dependency Hold
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Place Task on External Hold
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskForHold(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleHoldExternal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  External Department or Agency <span className="text-rose-500">*</span>
                </label>
                <select
                  value={externalDeptName}
                  onChange={(e) => setExternalDeptName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:border-[#154B38] focus:outline-none"
                >
                  <option value="Social Welfare Department">Social Welfare Department</option>
                  <option value="Healthcare Department">Healthcare Department</option>
                  <option value="Police / Verification Cell">Police / Verification Cell</option>
                  <option value="Revenue & Land Records">Revenue & Land Records</option>
                  <option value="National Informatics Centre">National Informatics Centre</option>
                  <option value="Public Works Department">Public Works Department</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dependency Reason & Hold Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={externalHoldReason}
                  onChange={(e) => setExternalHoldReason(e.target.value)}
                  placeholder="e.g. Awaiting income certificate verification from District Social Welfare Officer..."
                  required
                  className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-xs font-medium text-slate-900 outline-none focus:border-[#154B38]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] font-medium leading-relaxed">
                ℹ️ <b>SLA Protection:</b> The time elapsed while on external hold will be automatically recorded in the task audit log and subtracted from working duration during Timeliness scoring.
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setSelectedTaskForHold(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={<PauseCircle size={14} />}
                >
                  Confirm External Hold
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. TIMESTAMPED AUDIT TRAIL / HISTORY MODAL (SPEC REQUIREMENT) */}
      {selectedTaskForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#154B38]">
                  Auditable Timestamped History
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Task Execution Audit Trail
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskForHistory(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-slate-100">
                <p className="font-extrabold text-slate-900 text-sm">
                  {selectedTaskForHistory.title}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-slate-600 font-medium">
                  <span>Category: <b>{selectedTaskForHistory.category || "General"}</b></span>
                  <span>Complexity: <b>{selectedTaskForHistory.complexity || "Medium"} (2.0x)</b></span>
                  <span>Target: <b>{selectedTaskForHistory.target} units</b></span>
                  <span>Due Date: <b>{selectedTaskForHistory.dueDate || "Ongoing"}</b></span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <History size={14} className="text-[#154B38]" />
                  Timestamped Status Log ({selectedTaskForHistory.statusLog?.length || 1} Events)
                </h4>

                <div className="space-y-3 relative pl-6 border-l-2 border-slate-200">
                  {(selectedTaskForHistory.statusLog || [
                    {
                      from: null,
                      to: selectedTaskForHistory.status || "Pending",
                      timestamp: selectedTaskForHistory.createdAt,
                      changedBy: "System",
                    },
                  ]).map((entry, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-[#154B38] border-2 border-white ring-2 ring-emerald-100" />
                      <div className="rounded-xl border border-slate-100 bg-[#FAFCFB] p-3 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-[#154B38]">
                            {entry.from ? `${entry.from} → ` : "Created as "}
                            <span className="capitalize">{entry.to}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDateTime(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Action by: <b>{entry.changedBy || "Officer"}</b>
                        </p>
                        {entry.notes && (
                          <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100 mt-1.5 italic">
                            "{entry.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedTaskForHistory(null)}
              >
                Close Audit Log
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployeeTasks;