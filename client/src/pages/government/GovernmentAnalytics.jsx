import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Target,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Activity,
  CalendarDays,
  ShieldCheck,
  Gauge,
  Award,
  Info,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Layers,
  Users,
  Building2,
  Network,
  ArrowDown,
  UserCheck,
  FileCheck,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

import { getMissions, getTasks } from "../../utils/localStorage";
import {
  ROLE_WEIGHTS,
  calculateScore,
  calculateVolume,
  calculateTimeliness,
  calculateQuality,
  calculateComplexity,
  aggregateDepartmentScores,
  aggregateOrganizationScores,
  aggregateTeamScores,
  aggregateEmployeeScores,
  isTaskCompleted,
  isTaskSubmitted,
  isTaskOverdue,
  clamp,
} from "../../utils/scoringEngine";

const BASE_WORKING_TEAMS = [
  { id: "t1", name: "Scholarship Verification Team", organization: "Scholarship Services", department: "Education Department", lead: "Aarav Sharma", baseOfficers: 6 },
  { id: "t2", name: "Application Processing Team", organization: "Scholarship Services", department: "Education Department", lead: "Priya Verma", baseOfficers: 5 },
  { id: "t3", name: "Digital Platform Team", organization: "Digital Education", department: "Education Department", lead: "Rahul Singh", baseOfficers: 8 },
  { id: "t4", name: "Health Application Team", organization: "Health Services", department: "Healthcare Department", lead: "Rakesh Kumar", baseOfficers: 7 },
  { id: "t5", name: "Medical Records Team", organization: "Health Data Services", department: "Healthcare Department", lead: "Pooja Verma", baseOfficers: 6 },
  { id: "t6", name: "Document Verification Team", organization: "Document Services", department: "Citizen Services Department", lead: "Vikash Kumar", baseOfficers: 5 },
];

const GovernmentAnalytics = () => {
  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [period, setPeriod] = useState("This Month");
  const [view, setView] = useState("Overview");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    try {
      setMissions(Array.isArray(getMissions()) ? getMissions() : []);
      setTasks(Array.isArray(getTasks()) ? getTasks() : []);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, []);

  // Summary Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(isTaskCompleted).length;
    const ip = tasks.filter((t) => String(t.status || "").toLowerCase() === "in progress").length;
    const sub = tasks.filter(isTaskSubmitted).length;
    const pending = tasks.filter((t) => ["pending", "assigned"].includes(String(t.status || "").toLowerCase())).length;
    const od = tasks.filter(isTaskOverdue).length;

    return {
      total,
      done,
      ip,
      sub,
      pending,
      od,
      rate: total ? Math.round((done / total) * 100) : 0,
    };
  }, [tasks]);

  // Bottom-up Aggregated Scores
  const governmentScore = useMemo(() => calculateScore(tasks, missions), [tasks, missions]);
  const departmentScores = useMemo(() => aggregateDepartmentScores(tasks, missions), [tasks, missions]);
  const organizationScores = useMemo(() => aggregateOrganizationScores(tasks), [tasks]);
  const teamScores = useMemo(() => aggregateTeamScores(tasks, BASE_WORKING_TEAMS), [tasks]);
  const employeeScores = useMemo(() => aggregateEmployeeScores(tasks), [tasks]);

  const missionScores = useMemo(() => {
    return missions.map((m) => {
      const missionTasks = tasks.filter((t) => String(t.missionId) === String(m.id));
      const sc = calculateScore(missionTasks, missions);
      const done = missionTasks.filter(isTaskCompleted).length;
      const prog = missionTasks.length ? Math.round((done / missionTasks.length) * 100) : 0;
      return {
        id: m.id,
        name: m.title || "Untitled Mission",
        status: m.status || "Active",
        tasks: missionTasks.length,
        submitted: missionTasks.filter(isTaskSubmitted).length,
        completed: done,
        score: sc.score,
        progress: prog,
        departments: m.departments || [],
      };
    });
  }, [missions, tasks]);

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Government Intelligence (Bottom-Up Math Engine)
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Government Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Mathematical roll-up from task submissions to executive intelligence: Volume (25%), Timeliness (30%), Quality (30%), Complexity (15%).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            loading={refreshing}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <CalendarDays size={14} className="text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* TOP SCORE + CONTEXT GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 mb-7">
        <ScoreCard data={governmentScore} period={period} tasksCount={tasks.length} />
        <Context data={governmentScore} tasksCount={tasks.length} />
      </div>

      {/* 5 KPI STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-7">
        <Kpi
          title="Missions"
          value={missions.length}
          desc="Government missions"
          icon={<Target size={18} />}
          type="forest"
        />
        <Kpi
          title="Total Tasks"
          value={stats.total}
          desc="Across all divisions"
          icon={<Activity size={18} />}
          type="emerald"
        />
        <Kpi
          title="Verified Completed"
          value={stats.done}
          desc={`${stats.rate}% verified`}
          icon={<CheckCircle2 size={18} />}
          type="green"
        />
        <Kpi
          title="Pending Verification"
          value={stats.sub}
          desc="Awaiting supervisor review"
          icon={<Clock3 size={18} />}
          type="orange"
        />
        <Kpi
          title="Overdue Incomplete"
          value={stats.od}
          desc="SLA risk alerts"
          icon={<AlertTriangle size={18} />}
          type="red"
        />
      </div>

      {/* TAB NAVIGATION PILLS */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {["Overview", "Performance Ladder", "Departments", "Organizations & Teams", "Missions", "Task Log"].map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`
              rounded-full px-5 py-2 text-xs font-bold transition-all duration-150 cursor-pointer
              ${
                view === tab
                  ? "bg-[#154B38] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT VIEWS */}
      {view === "Overview" && (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6">
            <Factors data={governmentScore} />
            <TaskStatus stats={stats} />
          </div>
          <Department data={departmentScores} />
          <div className="mt-6">
            <Mission data={missionScores} />
          </div>
        </>
      )}

      {view === "Performance Ladder" && (
        <PerformanceLadderView
          governmentScore={governmentScore}
          departments={departmentScores}
          organizations={organizationScores}
          teams={teamScores}
          employees={employeeScores}
        />
      )}

      {view === "Departments" && <Department data={departmentScores} full />}
      {view === "Organizations & Teams" && (
        <OrgAndTeamsView organizations={organizationScores} teams={teamScores} />
      )}
      {view === "Missions" && <Mission data={missionScores} full />}
      {view === "Task Log" && <TaskAnalytics stats={stats} tasks={tasks} />}

      {/* FOOTER */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs font-medium text-slate-400">
        <span>Scoring Weights: Volume 25% • Timeliness 30% • Quality 30% • Complexity 15%</span>
        <span>SIH25250 Explainable E-Office Scoring Engine</span>
      </div>
    </DashboardLayout>
  );
};

/* =========================================================
   SCORE CARD WITH FOREST GREEN CONIC CIRCLE GAUGE
========================================================= */
function ScoreCard({ data, period, tasksCount }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 card-soft-shadow xl:col-span-2 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
            <Gauge size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Government Productivity Score
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Calculated from bottom-up task data ({tasksCount} records)
            </p>
          </div>
        </div>

        <Badge variant="sage">{period}</Badge>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
        {/* Radial Conic Ring */}
        <div className="flex flex-col items-center">
          <div
            className="relative flex h-44 w-44 items-center justify-center rounded-full shadow-inner transition-all duration-700"
            style={{
              background: `conic-gradient(#154B38 ${data.score}%, #E2E8F0 ${data.score}% 100%)`,
            }}
          >
            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white shadow-sm">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {data.score}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Index Score
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#154B38]">
            <Award size={14} />
            <span>Mathematical Rollup Score</span>
          </div>
        </div>

        {/* Factors Breakdown Bars */}
        <div className="space-y-4">
          <Factor label="Volume" value={data.volume} weight="25%" color="bg-[#154B38]" />
          <Factor label="Timeliness" value={data.timeliness} weight="30%" color="bg-[#1E654C]" />
          <Factor label="Quality" value={data.quality} weight="30%" color="bg-[#38A57F]" />
          <Factor label="Complexity" value={data.complexity} weight="15%" color="bg-[#2D7D60]" />
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-[#F4F6F8] p-3.5 border border-slate-100 flex items-start gap-2.5">
        <Info size={16} className="mt-0.5 text-[#154B38] shrink-0" />
        <p className="text-[11px] text-slate-600 font-medium">
          <span className="font-bold text-slate-800">Formula: </span>
          Score = (Volume × 0.25) + (Timeliness × 0.30) + (Quality × 0.30) + (Complexity × 0.15). Pure math with zero AI hallucinations.
        </p>
      </div>
    </div>
  );
}

function Factor({ label, value, weight, color = "bg-[#154B38]" }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-semibold text-slate-700">
          {label}{" "}
          <small className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
            {weight}
          </small>
        </span>
        <span className="font-extrabold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamp(value)}%` }}
        />
      </div>
    </div>
  );
}

function Context({ data, tasksCount }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 card-soft-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Evidence Context</h2>
            <p className="text-xs text-slate-400 font-medium">Verification integrity breakdown</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 bg-slate-50/50">
            <div>
              <p className="text-xs font-bold text-slate-800">Evidence Confidence</p>
              <p className="text-[10px] text-slate-400">Tasks with verified evidence proofs</p>
            </div>
            <Badge variant={data.confidence ? "completed" : "default"}>{data.confidence}%</Badge>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 bg-slate-50/50">
            <div>
              <p className="text-xs font-bold text-slate-800">SLA Anomalies</p>
              <p className="text-[10px] text-slate-400">Overdue unverified records</p>
            </div>
            <Badge variant={data.anomalies ? "danger" : "completed"}>
              {data.anomalies}
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 bg-slate-50/50">
            <div>
              <p className="text-xs font-bold text-slate-800">Verified Quality</p>
              <p className="text-[10px] text-slate-400">Deliverables backed by proof URL</p>
            </div>
            <Badge variant={data.quality ? "completed" : "default"}>{data.quality}%</Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-[#EBF6F0] p-3 text-[11px] font-semibold text-[#154B38] border border-[#D1EBDD]">
        {tasksCount === 0
          ? "No tasks recorded. When employees complete tasks, metrics roll up automatically."
          : "Every status change is timestamped and verified by team leads before factoring into scores."}
      </div>
    </div>
  );
}

function Kpi({ title, value, desc, icon, type }) {
  const typeStyles = {
    forest: "bg-[#154B38] text-white",
    emerald: "bg-[#EBF6F0] text-[#154B38]",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
  };

  const isForest = type === "forest";

  return (
    <div
      className={`
        rounded-2xl p-4 card-soft-shadow flex flex-col justify-between
        ${
          isForest
            ? "bg-forest-card-mesh text-white border border-emerald-950/20"
            : "bg-white border border-slate-200/80 text-slate-900"
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-[11px] font-semibold ${isForest ? "text-emerald-100/90" : "text-slate-500"}`}>
            {title}
          </p>
          <p className={`mt-1 text-2xl font-extrabold tracking-tight ${isForest ? "text-white" : "text-slate-900"}`}>
            {value}
          </p>
          <p className={`mt-0.5 text-[10px] ${isForest ? "text-emerald-200/70" : "text-slate-400"}`}>
            {desc}
          </p>
        </div>

        <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${typeStyles[type] || typeStyles.green}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Factors({ data }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 card-soft-shadow">
      <h2 className="text-base font-bold text-slate-900 mb-4">
        Productivity Factor Breakdown
      </h2>
      <div className="space-y-4">
        <Factor label="Volume (Completion Rate)" value={data.volume} weight="25%" color="bg-[#154B38]" />
        <Factor label="Timeliness (On-Time Delivery)" value={data.timeliness} weight="30%" color="bg-[#1E654C]" />
        <Factor label="Quality (Evidence Compliance)" value={data.quality} weight="30%" color="bg-[#38A57F]" />
        <Factor label="Complexity (Workload Difficulty)" value={data.complexity} weight="15%" color="bg-[#2D7D60]" />
      </div>
    </div>
  );
}

function TaskStatus({ stats }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 card-soft-shadow">
      <h2 className="text-base font-bold text-slate-900 mb-4">
        Task Completion Overview
      </h2>
      <div className="space-y-3.5">
        {[
          ["Completed (Verified)", stats.done, "bg-[#154B38]"],
          ["Submitted (In Review)", stats.sub, "bg-[#38A57F]"],
          ["In Progress", stats.ip, "bg-[#268564]"],
          ["Pending", stats.pending, "bg-amber-500"],
          ["Overdue Incomplete", stats.od, "bg-rose-500"],
        ].map(([l, v, c]) => {
          const pct = stats.total ? Math.round((v / stats.total) * 100) : 0;
          return (
            <div key={l}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-slate-600">{l}</span>
                <span className="font-extrabold text-slate-900">
                  {v} · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${c}`}
                  style={{ width: `${clamp(pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   PERFORMANCE LADDER VIEW (BOTTOM-UP VISUALIZATION)
========================================================= */
function PerformanceLadderView({ governmentScore, departments, organizations, teams, employees }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF6F0] text-[#154B38]">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bottom-Up Performance Ladder
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Task Data → Employee Performance → Team Efficiency → Organization Efficiency → Department Efficiency → Government Intelligence
            </p>
          </div>
        </div>

        {/* 5-Step Ladder Visual */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFC]">
            <span className="text-[10px] font-bold uppercase text-slate-400">Step 1: Task Data</span>
            <p className="text-sm font-extrabold text-slate-900 mt-1">{employees.reduce((s, e) => s + e.totalTasks, 0)} Raw Tasks</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Timestamped logs</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFC]">
            <span className="text-[10px] font-bold uppercase text-slate-400">Step 2: Employees</span>
            <p className="text-sm font-extrabold text-slate-900 mt-1">{employees.length} Officers</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Individual 4-factors</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFC]">
            <span className="text-[10px] font-bold uppercase text-slate-400">Step 3: Teams</span>
            <p className="text-sm font-extrabold text-slate-900 mt-1">{teams.length} Working Groups</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Weighted team efficiency</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFC]">
            <span className="text-[10px] font-bold uppercase text-slate-400">Step 4: Departments</span>
            <p className="text-sm font-extrabold text-slate-900 mt-1">{departments.length} Divisions</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Agency roll-up</p>
          </div>

          <div className="p-4 rounded-xl bg-forest-card-mesh text-white border border-emerald-950/20">
            <span className="text-[10px] font-bold uppercase text-emerald-200">Step 5: Government</span>
            <p className="text-xl font-extrabold text-white mt-0.5">{governmentScore.score}%</p>
            <p className="text-[10px] text-emerald-200/80">Apex intelligence score</p>
          </div>
        </div>
      </Card>

      {/* Top Performing Officers Table */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Employee Output Scores (Step 2)</h3>
        <p className="text-xs text-slate-400 mb-4">Calculated from each officer's individual completed deliverables.</p>

        {employees.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No employee task records currently in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                  <th className="pb-3 pr-4">Officer Name</th>
                  <th className="pb-3 px-3">Team / Agency</th>
                  <th className="pb-3 px-3">Volume</th>
                  <th className="pb-3 px-3">Timeliness</th>
                  <th className="pb-3 px-3">Quality</th>
                  <th className="pb-3 px-3">Complexity</th>
                  <th className="pb-3 pl-3 text-right">Final Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {employees.map((emp) => (
                  <tr key={emp.name} className="hover:bg-slate-50 transition">
                    <td className="py-3 pr-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EBF6F0] text-[#154B38] text-[10px]">
                        {emp.name.charAt(0)}
                      </span>
                      <span>{emp.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{emp.team}</td>
                    <td className="py-3 px-3 font-semibold">{emp.volume}%</td>
                    <td className="py-3 px-3 font-semibold">{emp.timeliness}%</td>
                    <td className="py-3 px-3 font-semibold">{emp.quality}%</td>
                    <td className="py-3 px-3 font-semibold">{emp.complexity}%</td>
                    <td className="py-3 pl-3 text-right font-extrabold text-[#154B38]">{emp.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Department({ data, full = false }) {
  const rows = full ? data : data.slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 card-soft-shadow">
      <h2 className="text-base font-bold text-slate-900">Department Productivity</h2>
      <p className="mt-0.5 text-xs text-slate-400 font-medium mb-4">
        Department scores aggregated from organization rollups.
      </p>

      {!rows.length ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No department task data available.
        </div>
      ) : (
        <div className="space-y-3.5">
          {rows.map((d) => (
            <div
              key={d.name}
              className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50/50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{d.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {d.organizationsCount} agencies · {d.totalTasks} tasks
                  </p>
                </div>
                <Badge variant={d.score > 0 ? "sage" : "default"}>Score {d.score}</Badge>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#154B38]"
                  style={{ width: `${d.score}%` }}
                />
              </div>

              <div className="mt-3 flex items-center gap-4 text-[10px] font-semibold text-slate-500">
                <span>Completed: <b className="text-emerald-700">{d.completedTasks}</b></span>
                <span>Submitted: <b className="text-amber-700">{d.submittedTasks}</b></span>
                <span>Overdue: <b className="text-rose-700">{d.overdueTasks}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrgAndTeamsView({ organizations, teams }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-base font-bold text-slate-900">Organization Level Efficiency (Step 4)</h2>
        <p className="text-xs text-slate-400 mb-4">Rolled up from team scores.</p>

        {organizations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No organization data recorded.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <div key={org.name} className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{org.name}</span>
                  <Badge variant={org.score > 0 ? "sage" : "default"}>{org.score}%</Badge>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{org.department} • {org.totalTasks} tasks</p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-[#154B38]" style={{ width: `${org.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-bold text-slate-900">Working Teams Efficiency (Step 3)</h2>
        <p className="text-xs text-slate-400 mb-4">Directly derived from employee task verification.</p>

        {teams.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No working teams registered.</div>
        ) : (
          <div className="space-y-3">
            {teams.map((t) => (
              <div key={t.name} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{t.name}</p>
                  <p className="text-[10px] text-slate-400">{t.department} • Lead: {t.lead}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 text-[10px]">Tasks</span>
                    <p className="font-bold text-slate-900">{t.completedTasks} / {t.totalTasks}</p>
                  </div>
                  <Badge variant={t.score > 0 ? "completed" : "default"}>{t.score}%</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Mission({ data, full = false }) {
  const rows = full ? data : data.slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 card-soft-shadow">
      <h2 className="text-base font-bold text-slate-900">Mission Productivity</h2>
      <p className="mt-0.5 text-xs text-slate-400 font-medium mb-4">
        Outcomes based on verified deliverables assigned to each state mission.
      </p>

      {!rows.length ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No mission data available.
        </div>
      ) : (
        <div className="space-y-3.5">
          {rows.map((m) => (
            <div
              key={String(m.id) || m.name}
              className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50/50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{m.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {m.status} · {m.tasks} tasks · {m.submitted} submitted
                  </p>
                </div>
                <Badge variant={m.score > 0 ? "sage" : "default"}>Score {m.score}</Badge>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Verified Completion</span>
                <span className="text-slate-900 font-bold">{m.progress}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#154B38]"
                  style={{ width: `${m.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskAnalytics({ stats, tasks }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 card-soft-shadow">
        <h2 className="text-base font-bold text-slate-900">Task Lifecycle Distribution</h2>
        <p className="mt-0.5 text-xs text-slate-400 font-medium mb-4">
          Current distribution across all verified task lifecycle stages.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Kpi
            title="Completed"
            value={stats.done}
            desc={`${stats.rate}% verified`}
            icon={<CheckCircle2 size={18} />}
            type="green"
          />
          <Kpi
            title="Submitted"
            value={stats.sub}
            desc="Awaiting verification"
            icon={<Clock3 size={18} />}
            type="orange"
          />
          <Kpi
            title="In Progress"
            value={stats.ip}
            desc="Currently active"
            icon={<Activity size={18} />}
            type="emerald"
          />
          <Kpi
            title="Overdue"
            value={stats.od}
            desc="Need attention"
            icon={<AlertTriangle size={18} />}
            type="red"
          />
        </div>

        {/* Live Task Table */}
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Live Task Records ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No task records found in localStorage.</div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-2">Title</th>
                  <th className="pb-2 px-2">Assigned Officer</th>
                  <th className="pb-2 px-2">Department</th>
                  <th className="pb-2 px-2">Priority</th>
                  <th className="pb-2 px-2">Evidence</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-900">{t.title || t.name}</td>
                    <td className="py-2.5 px-2 text-slate-600">{t.employeeName || t.assignedTo || "Unassigned"}</td>
                    <td className="py-2.5 px-2 text-slate-500">{t.department}</td>
                    <td className="py-2.5 px-2">
                      <Badge variant={String(t.priority).toLowerCase() === "high" ? "danger" : "default"}>
                        {t.priority || "Medium"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-2">
                      {t.evidenceUrl || t.evidenceNotes || t.proof ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <FileCheck size={11} /> Attached
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <Badge variant={isTaskCompleted(t) ? "completed" : isTaskSubmitted(t) ? "warning" : "default"}>
                        {t.status || "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default GovernmentAnalytics;