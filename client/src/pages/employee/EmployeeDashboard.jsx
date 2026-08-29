import React, { useEffect, useMemo, useState } from "react";
import {
  Target,
  ListChecks,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Bell,
  ArrowRight,
  CalendarDays,
  TrendingUp,
  RefreshCw,
  UserRound,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getEmployeeAllocations,
  getTasks,
  getMissions,
} from "../../utils/localStorage";
import { getEmployees } from "../../data/hierarchy";
import {
  calculateScore,
  calculateVolume,
  calculateTimeliness,
  calculateQuality,
  calculateComplexity,
} from "../../utils/scoringEngine";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const demoEmployees = useMemo(() => getEmployees(), []);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(() => getEmployees()[0]?.id || "emp_001");
  const [employeeAllocations, setEmployeeAllocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [missions, setMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const currentEmployee = demoEmployees.find((e) => e.id === selectedEmployeeId) || demoEmployees[0];

  const loadData = () => {
    setRefreshing(true);
    try {
      const allAlloc = getEmployeeAllocations() || [];
      const myAlloc = allAlloc.filter((a) => (a.employeeId || a.employee) === currentEmployee.id || a.employee === currentEmployee.name);
      setEmployeeAllocations(myAlloc);

      const allTasks = getTasks() || [];
      const myTasks = allTasks.filter(
        (t) => (t.employeeId || t.assignedTo) === currentEmployee.id || (t.employeeName || t.assignedTo) === currentEmployee.name
      );
      setTasks(myTasks);

      const allMissions = getMissions() || [];
      setMissions(allMissions);
    } catch (err) {
      console.error("Failed to load employee dashboard:", err);
      setEmployeeAllocations([]);
      setTasks([]);
      setMissions([]);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEmployeeId]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [selectedEmployeeId]);

  const stats = useMemo(() => {
    const targetFromTasks = tasks.reduce((sum, t) => sum + Number(t.target || 0), 0);
    const targetFromAlloc = employeeAllocations.reduce((sum, a) => sum + Number(a.allocatedTarget || a.target || 0), 0);
    const totalTarget = Math.max(targetFromTasks, targetFromAlloc);

    const completedTasks = tasks.filter((t) => String(t.status).toLowerCase() === "completed");
    const verifiedVolume = completedTasks.reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 0), 0);
    const inProgress = tasks.filter((t) => ["in progress", "pending"].includes(String(t.status).toLowerCase())).length;
    const pendingVerification = tasks.filter((t) =>
      ["pending verification", "submitted"].includes(String(t.status).toLowerCase())
    ).length;

    const rate = totalTarget > 0 ? Math.min(100, Math.round((verifiedVolume / totalTarget) * 100)) : 0;

    const scoreResult = calculateScore(tasks, missions, null, currentEmployee.role || "");
    const vScore = calculateVolume(tasks);
    const tScore = calculateTimeliness(tasks);
    const qScore = calculateQuality(tasks);
    const xScore = calculateComplexity(tasks, missions);

    return {
      totalTarget,
      verifiedVolume,
      inProgress,
      pendingVerification,
      completedCount: completedTasks.length,
      completionRate: rate,
      score: scoreResult.score,
      volumeScore: vScore,
      timelinessScore: tScore,
      qualityScore: qScore,
      complexityScore: xScore,
    };
  }, [tasks, employeeAllocations, missions, currentEmployee]);

  return (
    <DashboardLayout>
      {/* HEADER WITH OFFICER SELECTOR */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#154B38]">
              Officer Workbench
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-400">{currentEmployee.role}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {currentEmployee.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Daily deliverable tasks, target milestones, and submission verification status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Officer Selector Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <UserRound size={14} className="text-[#154B38]" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              {demoEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            loading={refreshing}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/employee/reports")}
            icon={<FileText size={14} />}
          >
            Audit Report
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/employee/tasks")}
            icon={<ListChecks size={14} />}
          >
            My Task Queue
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Productivity Score"
          value={`${stats.score} / 100`}
          change="Weighted composite efficiency"
          onAction={() => navigate("/employee/reports")}
          actionLabel="View Explanations"
        />

        <StatCard
          title="Assigned Target"
          value={stats.totalTarget.toLocaleString()}
          change={stats.totalTarget > 0 ? "Deliverable quota" : "No quota assigned"}
          onAction={() => navigate("/employee/tasks")}
          actionLabel="Submit Deliverable"
        />

        <StatCard
          title="Verified Outputs"
          value={stats.verifiedVolume.toLocaleString()}
          change={stats.totalTarget > 0 ? `${stats.completionRate}% quota achieved` : "0% achieved"}
          changeType={stats.verifiedVolume > 0 ? "positive" : "neutral"}
        />

        <StatCard
          title="Pending Verification"
          value={stats.pendingVerification}
          change="Submitted for lead review"
          changeType={stats.pendingVerification > 0 ? "neutral" : "positive"}
        />
      </div>

      {/* MATHEMATICAL SUB-SCORE BREAKDOWN (SIH25250 SPEC) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Volume Sub-Score (25%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">{stats.volumeScore}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#154B38] rounded-full" style={{ width: `${stats.volumeScore}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Timeliness Sub-Score (30%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">{stats.timelinessScore}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${stats.timelinessScore}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quality Sub-Score (30%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">{stats.qualityScore}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${stats.qualityScore}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Complexity Index (15%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">{stats.complexityScore}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${stats.complexityScore}%` }} />
          </div>
        </div>
      </div>

      {/* VELOCITY & ASSIGNED TASKS GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px] mb-7">
        {/* Active Tasks Queue */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Current Deliverable Tasks
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Active tasks assigned to {currentEmployee.name}.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/employee/tasks")}
              icon={<ArrowUpRight size={14} />}
            >
              Full Queue
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">No Tasks Assigned</p>
              <p className="mt-1 max-w-sm mx-auto text-slate-400">
                No deliverable tasks are currently assigned to {currentEmployee.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {tasks.slice(0, 5).map((t, idx) => {
                const isDone = String(t.status).toLowerCase() === "completed";
                const isPendingReview = ["pending verification", "submitted"].includes(String(t.status).toLowerCase());

                return (
                  <div
                    key={t.id || idx}
                    className="p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={isDone ? "completed" : isPendingReview ? "warning" : "default"}
                        >
                          {t.status || "In Progress"}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-400">
                          Target: {t.target || 0} units
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate">{t.title || t.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Due {t.dueDate || "Ongoing"}</p>
                    </div>

                    <div className="shrink-0">
                      {!isDone && !isPendingReview ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate("/employee/tasks")}
                          icon={<ListChecks size={13} />}
                        >
                          Work on Task
                        </Button>
                      ) : isPendingReview ? (
                        <Badge variant="warning">Under Review</Badge>
                      ) : (
                        <Badge variant="completed">Verified</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Progress Radial Gauge */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Personal Milestone</h3>
              <p className="text-xs text-slate-400">Target completion rate</p>
            </div>
            <Badge variant="completed">{stats.completionRate}%</Badge>
          </div>

          <div className="my-6 flex justify-center">
            <div
              className="relative flex h-36 w-36 items-center justify-center rounded-full shadow-inner"
              style={{
                background: `conic-gradient(#154B38 ${stats.completionRate}%, #E2E8F0 ${stats.completionRate}% 100%)`,
              }}
            >
              <div className="flex h-26 w-26 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                <span className="text-2xl font-extrabold text-slate-900">{stats.completionRate}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Verified</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold">Done</span>
              <p className="font-bold text-emerald-700 mt-0.5">{stats.verifiedVolume}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold">Target</span>
              <p className="font-bold text-slate-900 mt-0.5">{stats.totalTarget}</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;