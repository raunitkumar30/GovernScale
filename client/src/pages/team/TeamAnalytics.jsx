import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  Target,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Award,
  Sparkles,
  Sliders,
  Zap,
  Shield,
  Gauge,
  CalendarDays,
  FileText,
  Send,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import { getTasks, getMissions } from "../../utils/localStorage";
import { getTeams } from "../../data/hierarchy";
import {
  aggregateTeamScores,
  calculateScore,
  calculateVolume,
  calculateTimeliness,
  calculateQuality,
  calculateComplexity,
  isTaskCompleted,
  isTaskOverdue,
  isTaskSubmitted,
} from "../../utils/scoringEngine";
import { useAuth } from "../auth/AuthContext";

const TeamAnalytics = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const allTeams = useMemo(() => getTeams(), []);
  const [teamName, setTeamName] = useState(() => {
    return (
      currentUser?.team ||
      allTeams[0]?.name ||
      "Scholarship Verification Team"
    );
  });

  const [tasks, setTasks] = useState([]);
  const [missions, setMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    try {
      const allTasks = getTasks() || [];
      const teamTasks = allTasks.filter(
        (t) => String(t.team || "").toLowerCase() === teamName.toLowerCase()
      );
      setTasks(teamTasks);
      setMissions(getMissions() || []);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadData();
  }, [teamName]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [teamName]);

  const teamScoreData = useMemo(() => {
    return aggregateTeamScores(tasks, allTeams);
  }, [tasks, allTeams]);

  const currentTeamObj = useMemo(() => {
    if (Array.isArray(teamScoreData)) {
      const match = teamScoreData.find(
        (t) => (t.name || "").toLowerCase() === teamName.toLowerCase()
      );
      if (match) return match;
    }

    const baseSc = calculateScore(tasks, missions);
    return {
      name: teamName,
      score: baseSc.score,
      volume: calculateVolume(tasks),
      timeliness: calculateTimeliness(tasks),
      quality: calculateQuality(tasks),
      complexity: calculateComplexity(tasks, missions),
      totalTasks: tasks.length,
      completedTasks: tasks.filter(isTaskCompleted).length,
      submittedTasks: tasks.filter(isTaskSubmitted).length,
      overdueTasks: tasks.filter(isTaskOverdue).length,
      memberBreakdown: [],
      bottleneckAlert: null,
      redistributionRecommendation: null,
    };
  }, [teamScoreData, teamName, tasks, missions]);

  const members = currentTeamObj.memberBreakdown || [];

  const completedCount = tasks.filter(isTaskCompleted).length;
  const pendingCount = tasks.filter(isTaskSubmitted).length;
  const overdueCount = tasks.filter(isTaskOverdue).length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <BarChart3 size={14} />
            <span>Team Efficiency & Workload Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {teamName} Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Frontline officer performance breakdown, mathematical sub-scores (V/T/Q/X), and bottleneck detection alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {allTeams.length > 1 && (
            <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200/80 px-3.5 py-1.5 shadow-2xs">
              <Users size={15} className="text-[#154B38]" />
              <select
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {allTeams.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/team/dashboard")}
            icon={<Gauge size={14} />}
          >
            Dashboard
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/team/reports")}
            icon={<FileText size={14} />}
          >
            Audit Report
          </Button>

          <button
            type="button"
            onClick={loadData}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 shadow-2xs cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* PHASE 6: AUTOMATED BOTTLENECK & REDISTRIBUTION BANNER */}
      {currentTeamObj.bottleneckAlert && (
        <div className="mb-8 p-5 rounded-3xl border border-amber-200 bg-amber-50/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                Phase 6 Bottleneck Detection Engine
              </span>
              <p className="text-xs font-bold text-amber-950 mt-0.5">
                {currentTeamObj.bottleneckAlert}
              </p>
              {currentTeamObj.redistributionRecommendation && (
                <p className="text-[11px] text-amber-800 font-medium mt-1">
                  💡 <b>Recommendation:</b> {currentTeamObj.redistributionRecommendation}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="shrink-0 bg-amber-800 hover:bg-amber-900 border-amber-900"
            onClick={() => navigate("/team/dashboard")}
            icon={<Send size={13} />}
          >
            Redistribute Queue
          </Button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          featured={true}
          title="Team Efficiency Index"
          value={`${currentTeamObj.score || 0} / 100`}
          change="Volume-weighted officer roll-up"
        />

        <StatCard
          title="Active Officers"
          value={members.length > 0 ? members.length : 1}
          change="Frontline verification staff"
          changeType="positive"
        />

        <StatCard
          title="Completed Deliverables"
          value={`${completedCount} / ${tasks.length}`}
          change={`${
            tasks.length > 0
              ? Math.round((completedCount / tasks.length) * 100)
              : 0
          }% team fulfillment rate`}
          changeType={completedCount > 0 ? "positive" : "neutral"}
        />

        <StatCard
          title="Supervisory Audit Desk"
          value={pendingCount}
          change={
            pendingCount > 0
              ? "Submissions awaiting supervisor review"
              : "All deliverables audited"
          }
          changeType={pendingCount > 0 ? "warning" : "positive"}
        />
      </div>

      {/* 4-PILLAR MATHEMATICAL SUB-SCORE BREAKDOWN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Volume Output (25%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {currentTeamObj.volume || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#154B38] rounded-full"
              style={{ width: `${currentTeamObj.volume || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Timeliness SLA (30%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {currentTeamObj.timeliness || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${currentTeamObj.timeliness || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quality Compliance (30%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {currentTeamObj.quality || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-cyan-600 rounded-full"
              style={{ width: `${currentTeamObj.quality || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Complexity Index (15%)
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {currentTeamObj.complexity || 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full"
              style={{ width: `${currentTeamObj.complexity || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Officer Performance Table */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-[#154B38]" />
              Frontline Officer Performance Breakdown
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Individual mathematical sub-scores across volume, timeliness, quality, and complexity.
            </p>
          </div>
          <Badge variant="sage">SIH25250 Brain</Badge>
        </div>

        {members.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Users size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No officer activity recorded yet</p>
            <p className="mt-0.5">Assigned officer deliverables will automatically populate here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Rank</th>
                  <th className="pb-3 px-4">Officer Name</th>
                  <th className="pb-3 px-4">Completed / Assigned</th>
                  <th className="pb-3 px-4">Volume (25%)</th>
                  <th className="pb-3 px-4">Timeliness (30%)</th>
                  <th className="pb-3 px-4">Quality (30%)</th>
                  <th className="pb-3 px-4">Complexity (15%)</th>
                  <th className="pb-3 px-4">Efficiency Score</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {members.map((off, idx) => {
                  const comp = off.completedCount || 0;
                  const tot = off.tasks?.length || 1;
                  const isOptimal = (off.score || 0) >= 80;
                  const isBehind = (off.overdueCount || 0) > 0 || (off.score || 0) < 65;

                  return (
                    <tr key={off.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pr-4 font-black text-slate-900">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-black">
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {off.name}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-800">
                        {comp} / {tot}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {off.volume || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {off.timeliness || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {off.quality || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {off.complexity || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-black text-sm text-[#154B38]">
                        {off.score || 0} / 100
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Badge
                          variant={
                            isBehind
                              ? "danger"
                              : isOptimal
                              ? "completed"
                              : "warning"
                          }
                        >
                          {isBehind
                            ? "Latency / Rework"
                            : isOptimal
                            ? "Optimal Pace"
                            : "Standard"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default TeamAnalytics;
