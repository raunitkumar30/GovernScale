import React, { useState, useMemo, useEffect } from "react";
import {
  BrainCircuit,
  Search,
  Target,
  Users,
  Activity,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Award,
  RefreshCw,
  Zap,
  Check,
  Building2,
  ArrowUpRight,
  FileCheck,
  Layers,
  Filter,
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
  getTeamAllocations,
  createDepartmentAllocation,
} from "../../utils/localStorage";
import {
  evaluateDecisionSupport,
  isTaskCompleted,
  isTaskSubmitted,
  isTaskOverdue,
  calculateScore,
} from "../../utils/scoringEngine";
import { notifyTaskDataChanged } from "../../utils/taskEvents";
import { getTeams } from "../../data/hierarchy";

const CATEGORIES = [
  { id: "all", label: "All Operational Categories" },
  { id: "scholarship", label: "Scholarship & Education" },
  { id: "health", label: "Healthcare & Records" },
  { id: "verification", label: "Document Verification" },
  { id: "citizen", label: "Citizen Applications" },
];

const DecisionSupport = () => {
  const navigate = useNavigate();

  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // Parameter Inputs matching PDF Section 5
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [taskVolume, setTaskVolume] = useState("500");
  const [timelineDays, setTimelineDays] = useState("7");
  const [priority, setPriority] = useState("High");
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [assignedSuccess, setAssignedSuccess] = useState(false);

  const loadData = () => {
    setLoading(true);
    try {
      const storedMissions = getMissions() || [];
      const storedTasks = getTasks() || [];
      setMissions(storedMissions);
      setTasks(storedTasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, []);

  // Calculate Evidence-Based Rankings using scoring engine
  const recommendations = useMemo(() => {
    const activeTeams = getTeams().map((t) => ({
      ...t,
      lead: t.supervisor || t.lead || "Team Supervisor",
    }));
    return evaluateDecisionSupport(tasks, selectedCategory, activeTeams);
  }, [tasks, selectedCategory]);

  const topTeam = recommendations.find((r) => r.id === selectedTeamId) || recommendations[0] || null;

  const handleRunOptimizer = () => {
    setOptimizing(true);
    setAssignedSuccess(false);
    setTimeout(() => {
      setOptimizing(false);
      if (recommendations.length > 0) {
        setSelectedTeamId(recommendations[0].id);
      }
    }, 400);
  };

  const handleAssignToTeam = () => {
    if (!topTeam) return;
    setAssignedSuccess(true);
    notifyTaskDataChanged();
    setTimeout(() => {
      setAssignedSuccess(false);
      navigate(`/government/missions/create?category=${selectedCategory}&volume=${taskVolume}&team=${encodeURIComponent(topTeam.name)}&dept=${encodeURIComponent(topTeam.department)}`);
    }, 1200);
  };

  const totalVerifiedCompleted = useMemo(() => {
    return tasks.filter(isTaskCompleted).length;
  }, [tasks]);

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Evidence-Based Directives (SIH25250 Section 5)
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Decision Support Engine
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Based on historical evidence from completed tasks, recommend the highest-fit team to handle urgent missions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            onClick={handleRunOptimizer}
            loading={optimizing}
            icon={<BrainCircuit size={16} />}
          >
            Run Optimizer
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS DERIVED FROM REAL TASK EVIDENCE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Verified Task Evidence"
          value={totalVerifiedCompleted}
          change={totalVerifiedCompleted > 0 ? "Completed & verified records" : "No task history recorded"}
        />
        <StatCard
          title="Top Team Score"
          value={topTeam && topTeam.score > 0 ? `${topTeam.score}%` : "0%"}
          change={topTeam && topTeam.hasEvidence ? topTeam.name : "Awaiting task completions"}
          changeType={topTeam && topTeam.score > 0 ? "positive" : "neutral"}
        />
        <StatCard
          title="Avg. Capacity Utilized"
          value={tasks.length > 0 ? `${Math.round(recommendations.reduce((s, r) => s + r.workload, 0) / recommendations.length)}%` : "0%"}
          change={tasks.length > 0 ? "Active workload across teams" : "100% capacity free"}
          changeType="neutral"
        />
        <StatCard
          title="Available Officers"
          value={`${recommendations.reduce((s, r) => s + r.availableOfficers, 0)} Staff`}
          change="Available across working groups"
          changeType="positive"
        />
      </div>

      {/* WORKFLOW PROMPT & INPUT PARAMETERS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px] mb-7">
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
              <BrainCircuit size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Urgent Mission Allocation Parameters
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Task Category → Pull historical tasks → Filter relevant teams → Calculate recent performance → Rank teams
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Task Category / Domain
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#154B38] focus:ring-4 focus:ring-[#154B38]/10"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Deliverable Target Units"
              type="number"
              value={taskVolume}
              onChange={(e) => setTaskVolume(e.target.value)}
              placeholder="500"
            />

            <Input
              label="Delivery Timeline (Days)"
              type="number"
              value={timelineDays}
              onChange={(e) => setTimelineDays(e.target.value)}
              placeholder="7"
            />
          </div>

          {/* EXACT TABLE FORMAT FROM SECTION 5 OF SYSTEM DESIGN */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ranked Team Recommendations ({recommendations.length} Working Groups)
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Pure math evaluation based on historical task records
              </span>
            </div>

            {totalVerifiedCompleted === 0 ? (
              <div className="py-12 px-6 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-center">
                <ShieldCheck size={36} className="mx-auto mb-2 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-800">No Historical Task Records Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  When employees complete tasks and team supervisors verify deliverables with evidence, the Decision Support engine will automatically pull historical evidence, calculate on-time % and quality %, and rank candidate teams.
                </p>
              </div>
            ) : null}

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                    <th className="pb-3 pr-3">Rank</th>
                    <th className="pb-3 px-3">Working Team</th>
                    <th className="pb-3 px-3">Fit Score</th>
                    <th className="pb-3 px-3">Similar Tasks Handled</th>
                    <th className="pb-3 px-3">On-Time %</th>
                    <th className="pb-3 px-3">Quality %</th>
                    <th className="pb-3 pl-3 text-right">Workload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {recommendations.map((rec) => {
                    const isSelected = selectedTeamId === rec.id || (!selectedTeamId && rec.rank === 1);

                    return (
                      <tr
                        key={rec.id}
                        onClick={() => setSelectedTeamId(rec.id)}
                        className={`
                          cursor-pointer transition-colors
                          ${
                            isSelected
                              ? "bg-[#EBF6F0]/60 font-bold"
                              : "hover:bg-slate-50"
                          }
                        `}
                      >
                        <td className="py-3.5 pr-3">
                          <span
                            className={`
                              flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                              ${
                                rec.rank === 1 && rec.score > 0
                                  ? "bg-[#154B38] text-white"
                                  : "bg-slate-100 text-slate-600"
                              }
                            `}
                          >
                            #{rec.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-900">{rec.name}</p>
                          <p className="text-[10px] text-slate-400">{rec.department} • {rec.organization}</p>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`text-sm font-extrabold ${rec.score > 0 ? "text-[#154B38]" : "text-slate-400"}`}>
                            {rec.score}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {rec.similarTasksHandled > 0 ? `${rec.similarTasksHandled} tasks` : "—"}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {rec.onTimeRate}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {rec.qualityRate}
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <Badge variant={rec.workload > 80 ? "danger" : rec.workload > 40 ? "warning" : "completed"}>
                            {rec.workload}% Load
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* TOP RECOMMENDATION SUMMARY CARD */}
        <div className="space-y-5">
          {topTeam && (
            <div className="rounded-2xl bg-forest-card-mesh text-white p-6 card-soft-shadow border border-emerald-950/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  {topTeam.hasEvidence ? "Top Recommended Candidate" : "Selected Candidate"}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-white">
                {topTeam.name}
              </h3>
              <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                Supervisor: <b>{topTeam.lead}</b> ({topTeam.department}). Handled <b>{topTeam.similarTasksHandled}</b> verified deliverables with {topTeam.availableOfficers} active officers available.
              </p>

              <div className="mt-5 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-200">Historical Fit Score:</span>
                  <span className="font-bold text-white">{topTeam.score}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-200">On-Time Reliability:</span>
                  <span className="font-bold text-white">{topTeam.onTimeRate}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-200">Verified Quality:</span>
                  <span className="font-bold text-white">{topTeam.qualityRate}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-200">Current Workload:</span>
                  <span className="font-bold text-white">{topTeam.workload}% capacity</span>
                </div>
              </div>

              {assignedSuccess ? (
                <div className="mt-5 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-center text-xs font-bold text-emerald-100 flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Check size={16} className="text-emerald-300" />
                  <span>Mission Target Successfully Allocated!</span>
                </div>
              ) : (
                <Button
                  variant="emerald"
                  size="sm"
                  className="w-full mt-5 font-bold"
                  onClick={handleAssignToTeam}
                >
                  Assign Mission to {topTeam.name.split(" ")[0]}
                </Button>
              )}
            </div>
          )}

          <Card className="p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Decision Safety Rules (SIH25250)
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#154B38] shrink-0 mt-0.5" />
                <span>Workload must remain under 85% capacity threshold</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#154B38] shrink-0 mt-0.5" />
                <span>Requires historical evidence proof uploads for quality scoring</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#154B38] shrink-0 mt-0.5" />
                <span>Weighted aggregation prevents small teams skewing scores</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DecisionSupport;