import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Target,
  TrendingUp,
  Award,
  ClipboardCheck,
  ListChecks,
  UserRound,
  RefreshCw,
  Search,
  Eye,
  X,
  Gauge,
  Check,
  Filter,
  HelpCircle,
  Sparkles,
  Info,
  ShieldCheck,
  Sliders,
  Zap,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import { getTasks, getMissions } from "../../utils/localStorage";
import {
  calculateScore,
  clamp,
  getRoleWeights,
  calculateExternalDelayMs,
} from "../../utils/scoringEngine";
import { getEmployees } from "../../data/hierarchy";

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

const EmployeeReports = () => {
  const DEMO_EMPLOYEES = useMemo(() => getEmployees(), []);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    () => getEmployees()[0]?.id || "emp_001"
  );
  const [dateRange, setDateRange] = useState("This Month");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState([]);
  const [missions, setMissions] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);

  // Phase 5 Explainability Modal State
  const [showExplainModal, setShowExplainModal] = useState(false);

  const currentEmployee =
    DEMO_EMPLOYEES.find((e) => e.id === selectedEmployeeId) || DEMO_EMPLOYEES[0];

  const loadData = () => {
    setLoading(true);
    try {
      const allTasks = getTasks() || [];
      const myTasks = allTasks.filter(
        (t) =>
          (t.employeeId || t.assignedTo) === currentEmployee.id ||
          (t.employeeName || t.assignedTo) === currentEmployee.name
      );
      setTasks(myTasks);

      const allMissions = getMissions() || [];
      setMissions(allMissions);
    } catch (err) {
      console.error("Failed to load officer tasks for report:", err);
      setTasks([]);
      setMissions([]);
    } finally {
      setTimeout(() => setLoading(false), 300);
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

  // Phase 5: Calculate score with specific employee role weights
  const scoreData = useMemo(() => {
    return calculateScore(tasks, missions, null, currentEmployee.role || "");
  }, [tasks, missions, currentEmployee]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completedTasks = tasks.filter(
      (t) => normalizeStatus(t.status) === "Completed"
    );
    const completed = completedTasks.length;

    const pendingVerification = tasks.filter(
      (t) => normalizeStatus(t.status) === "Pending Verification"
    ).length;

    const inProgress = tasks.filter(
      (t) =>
        normalizeStatus(t.status) === "In Progress" ||
        normalizeStatus(t.status) === "Waiting External" ||
        normalizeStatus(t.status) === "Pending"
    ).length;

    const overdue = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return (
        !isNaN(d.getTime()) &&
        d < new Date() &&
        normalizeStatus(t.status) !== "Completed"
      );
    }).length;

    const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pendingVerification,
      inProgress,
      overdue,
      progress: progressRate,
      onTime: scoreData.timeliness,
      proof: scoreData.quality,
      volume: scoreData.volume,
      complexity: scoreData.complexity,
      score: scoreData.score,
      confidence: scoreData.confidence,
      anomalyFlags: scoreData.anomalyFlags || [],
      weightsUsed: scoreData.weightsUsed || getRoleWeights(currentEmployee.role),
    };
  }, [tasks, scoreData, currentEmployee]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search ||
        (t.title || t.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.category || "").toLowerCase().includes(search.toLowerCase());

      const norm = normalizeStatus(t.status);
      const isOverdue = (() => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return !isNaN(d.getTime()) && d < new Date() && norm !== "Completed";
      })();

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Overdue" ? isOverdue : norm === statusFilter);

      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusFilter]);

  const handleDownload = () => {
    const data = {
      officer: currentEmployee.name,
      employeeId: currentEmployee.id,
      role: currentEmployee.role,
      department: currentEmployee.department,
      organization: currentEmployee.organization,
      period: dateRange,
      generatedAt: new Date().toISOString(),
      scoreSummary: {
        finalScore: metrics.score,
        volume: metrics.volume,
        timeliness: metrics.onTime,
        quality: metrics.proof,
        complexity: metrics.complexity,
        confidence: metrics.confidence,
        weights: metrics.weightsUsed,
        anomalies: metrics.anomalyFlags,
      },
      deliverables: tasks.map((t) => ({
        id: t.id,
        title: t.title || t.name,
        category: t.category || "General",
        complexity: t.complexity || "Medium",
        status: t.status,
        target: t.target || 1,
        verifiedTarget: t.verifiedTarget || 0,
        dueDate: t.dueDate || "Ongoing",
        completedAt: t.completedAt || t.verifiedAt || "N/A",
        evidenceNotes: t.evidenceNotes || "None",
        evidenceUrl: t.evidenceUrl || "None",
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Officer_Report_${currentEmployee.name.replace(
      /\s+/g,
      "_"
    )}_${dateRange.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const weights = metrics.weightsUsed;

  return (
    <DashboardLayout>
      {/* HEADER WITH OFFICER SELECTOR & ACTIONS */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Phase 5 • Mathematical Productivity Intelligence
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {currentEmployee.name} Performance Audit
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Role-weighted scoring brain, confidence metric, and auditable performance ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Officer Selector Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <UserRound size={14} className="text-[#154B38]" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">
              Officer:
            </span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              {DEMO_EMPLOYEES.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowExplainModal(true)}
            icon={<HelpCircle size={14} className="text-[#154B38]" />}
          >
            Why is my score {metrics.score}?
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            icon={<Download size={14} />}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* ANOMALY / RECOGNITION FLAGS BANNER */}
      {metrics.anomalyFlags.length > 0 && (
        <div className="mb-7 space-y-2">
          {metrics.anomalyFlags.map((flag, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs animate-in fade-in ${
                flag.type === "positive"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : flag.type === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} className="shrink-0 text-[#154B38]" />
                <div>
                  <span className="font-extrabold uppercase text-[10px] tracking-wider block">
                    {flag.tag}
                  </span>
                  <p className="font-medium text-xs mt-0.5">{flag.detail}</p>
                </div>
              </div>
              <Badge variant={flag.type === "positive" ? "completed" : "warning"}>
                Confidence: {metrics.confidence}%
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Overall Productivity Score"
          value={metrics.total > 0 ? `${metrics.score} / 100` : "0 / 100"}
          change={`Confidence: ${metrics.confidence}% (${metrics.completed} verified tasks)`}
          onAction={() => setShowExplainModal(true)}
          actionLabel="Explain Score"
        />
        <StatCard
          title="Verified Deliverables"
          value={metrics.completed}
          change={
            metrics.total > 0 ? `${metrics.progress}% completion rate` : "0% completion"
          }
          changeType={metrics.completed > 0 ? "positive" : "neutral"}
        />
        <StatCard
          title="Under Lead Audit"
          value={metrics.pendingVerification}
          change={
            metrics.pendingVerification > 0
              ? "Awaiting supervisor verification"
              : "Queue clear"
          }
          changeType={metrics.pendingVerification > 0 ? "neutral" : "positive"}
        />
        <StatCard
          title="On-Time Delivery SLA"
          value={metrics.completed > 0 ? `${metrics.onTime}%` : "0%"}
          change="External delays excluded"
          changeType={metrics.onTime >= 80 ? "positive" : "neutral"}
        />
      </div>

      {/* 4-FACTOR SCORING BREAKDOWN & FORMULA */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-7">
        {/* 4-Factor Scoring Breakdown Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
                  <Gauge size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Productivity Scoring Factors
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Applied Role Weights ({currentEmployee.role || "Standard"})
                  </p>
                </div>
              </div>
              <Badge variant="sage">{metrics.score} / 100</Badge>
            </div>

            <div className="space-y-3.5">
              <FactorRow
                label="Volume Score (V)"
                value={metrics.volume}
                weight={`${Math.round((weights.volume ?? 0.25) * 100)}%`}
                desc="Completed vs assigned deliverable volume"
                color="bg-[#154B38]"
              />
              <FactorRow
                label="Timeliness Score (T)"
                value={metrics.onTime}
                weight={`${Math.round((weights.timeliness ?? 0.30) * 100)}%`}
                desc="Completion within deadline (external holds excluded)"
                color="bg-[#1E654C]"
              />
              <FactorRow
                label="Quality Score (Q)"
                value={metrics.proof}
                weight={`${Math.round((weights.quality ?? 0.30) * 100)}%`}
                desc="First-pass supervisor approval compliance"
                color="bg-[#38A57F]"
              />
              <FactorRow
                label="Complexity Score (X)"
                value={metrics.complexity}
                weight={`${Math.round((weights.complexity ?? 0.15) * 100)}%`}
                desc="Average task complexity points (Low: 40, Med: 70, High: 100)"
                color="bg-[#2D7D60]"
              />
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Formula:{" "}
              <b>
                {weights.volume}V + {weights.timeliness}T + {weights.quality}Q + {weights.complexity}X
              </b>
            </span>
            <button
              onClick={() => setShowExplainModal(true)}
              className="font-bold text-[#154B38] hover:underline cursor-pointer"
            >
              Detailed Breakdown →
            </button>
          </div>
        </Card>

        {/* Deliverable Status Breakdown Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Deliverable Workflow Distribution
            </h3>
            <p className="text-xs text-slate-400 font-medium mb-5">
              Operational status across {metrics.total} assigned tasks.
            </p>

            {metrics.total === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <ClipboardCheck size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No Task History</p>
                <p className="mt-0.5">No tasks assigned to {currentEmployee.name}.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {[
                  ["Verified Completed", metrics.completed, "bg-[#154B38]"],
                  ["Pending Verification", metrics.pendingVerification, "bg-amber-500"],
                  ["In Progress", metrics.inProgress, "bg-[#38A57F]"],
                  ["Overdue", metrics.overdue, "bg-rose-500"],
                ].map(([label, val, col]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1 font-semibold">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-bold text-slate-900">
                        {val}{" "}
                        <small className="text-slate-400">
                          ({metrics.total > 0 ? Math.round((val / metrics.total) * 100) : 0}%)
                        </small>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${col}`}
                        style={{
                          width: `${metrics.total > 0 ? (val / metrics.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 text-xs text-slate-500 flex items-center justify-between pt-3 border-t border-slate-100">
            <span>
              Role: <b className="text-slate-800">{currentEmployee.role || "Officer"}</b>
            </span>
            <span>
              Sample Confidence: <b className="text-[#154B38]">{metrics.confidence}%</b>
            </span>
          </div>
        </Card>
      </div>

      {/* DETAILED DELIVERABLES AUDIT TABLE */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Deliverables Scoring Ledger
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Itemized task records and evidence submission history for {currentEmployee.name}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search deliverables..."
                className="w-48 sm:w-56 rounded-full border border-slate-200/90 bg-[#F4F6F8] py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#154B38]"
              />
            </div>

            <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <Filter size={12} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting External">Waiting External</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <p className="font-bold text-slate-700">No matching deliverables</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  <th className="pb-3 pr-4">Task Deliverable</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Complexity</th>
                  <th className="pb-3 px-4">Target / Verified</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTasks.map((t) => {
                  const norm = normalizeStatus(t.status);
                  const isCompleted = norm === "Completed";

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pr-4">
                        <p className="font-bold text-slate-900">{t.title || t.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Due: {t.dueDate || "Ongoing"}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {t.category || "General"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-700">
                        {t.complexity || "Medium"}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {t.verifiedTarget || (isCompleted ? t.target : 0)} / {t.target || 1} units
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            isCompleted
                              ? "completed"
                              : norm === "Pending Verification"
                              ? "warning"
                              : norm === "Rejected"
                              ? "danger"
                              : "default"
                          }
                        >
                          {norm}
                        </Badge>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        {t.evidenceNotes || t.evidenceUrl ? (
                          <span className="text-[11px] font-bold text-[#154B38] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Verified Proof
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* PHASE 5: "WHY IS MY SCORE X?" EXPLAINABILITY BREAKDOWN MODAL */}
      {showExplainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#154B38]">
                  Phase 5 • Mathematical Explainability Engine
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Why is my score {metrics.score} / 100?
                </h3>
              </div>
              <button
                onClick={() => setShowExplainModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Formula Card */}
              <div className="p-4 rounded-2xl bg-[#EBF6F0] border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">
                    Formula applied for {currentEmployee.role || "Officer"}:
                  </span>
                  <span className="text-base font-extrabold text-[#154B38]">
                    Score = {metrics.score}
                  </span>
                </div>
                <p className="font-mono text-xs font-bold text-[#154B38] mt-1.5">
                  ({metrics.volume} × {weights.volume}) + ({metrics.onTime} × {weights.timeliness}) + ({metrics.proof} × {weights.quality}) + ({metrics.complexity} × {weights.complexity}) = {metrics.score}
                </p>
              </div>

              {/* 4 Pillars Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800">1. Volume Score</span>
                    <span className="text-[#154B38] font-extrabold">{metrics.volume} / 100</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Completed <b>{metrics.completed}</b> out of <b>{metrics.total}</b> assigned deliverable tasks ({metrics.progress}%).
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Weight contribution: {Math.round(metrics.volume * weights.volume)} pts</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800">2. Timeliness Score</span>
                    <span className="text-[#154B38] font-extrabold">{metrics.onTime} / 100</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Adherence to mandated deadlines. Inter-departmental hold delays were <b>fairly excluded</b> from deduction.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Weight contribution: {Math.round(metrics.onTime * weights.timeliness)} pts</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800">3. Quality Score</span>
                    <span className="text-[#154B38] font-extrabold">{metrics.proof} / 100</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    First-pass verification rate by team supervisor with compliant document proof attachments.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Weight contribution: {Math.round(metrics.proof * weights.quality)} pts</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800">4. Complexity Score</span>
                    <span className="text-[#154B38] font-extrabold">{metrics.complexity} / 100</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Weighted difficulty of assigned tasks (High: 100 pts / 2.0x, Medium: 70 pts / 1.5x, Low: 40 pts / 1.0x).
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Weight contribution: {Math.round(metrics.complexity * weights.complexity)} pts</p>
                </div>
              </div>

              {/* Sample Confidence & Anomaly Analysis */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between items-center font-bold mb-2">
                  <span className="text-slate-900">Sample Confidence & Statistical Validity</span>
                  <Badge variant={metrics.confidence >= 80 ? "completed" : "warning"}>
                    {metrics.confidence}% Confidence
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Based on <b>{metrics.completed} verified tasks</b> in the evaluation window. Minimum sample of 10+ completed tasks yields $95\%+$ statistical confidence for appraisal.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowExplainModal(false)}
              >
                Close Explanation
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const FactorRow = ({ label, value, weight, desc, color }) => {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold mb-1">
        <span className="text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-bold">Weight: {weight}</span>
          <span className="font-extrabold text-slate-900">{value}/100</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default EmployeeReports;