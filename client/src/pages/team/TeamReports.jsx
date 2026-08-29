import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  Eye,
  CalendarDays,
  BarChart3,
  ClipboardList,
  Users,
  CheckCircle2,
  Clock3,
  Search,
  X,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Gauge,
  Sliders,
  Send,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getTeamAllocations,
  getTasks,
  getMissions,
} from "../../utils/localStorage";
import { getTeams } from "../../data/hierarchy";
import { aggregateTeamScores, calculateScore } from "../../utils/scoringEngine";

const TeamReports = () => {
  const navigate = useNavigate();
  const [selectedTeamName, setSelectedTeamName] = useState(
    () => getTeams()[0]?.name || "Scholarship Verification Team"
  );
  const [tasks, setTasks] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedOfficerModal, setSelectedOfficerModal] = useState(null);

  // Dynamic available teams list
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
      ) || allAvailableTeams[0]
    );
  }, [allAvailableTeams, selectedTeamName]);

  const loadData = () => {
    setLoading(true);
    try {
      const allTasks = getTasks() || [];
      const teamTasks = allTasks.filter(
        (t) =>
          (t.team && t.team.toLowerCase() === selectedTeamName.toLowerCase()) ||
          (t.teamName &&
            t.teamName.toLowerCase() === selectedTeamName.toLowerCase())
      );

      const allAllocations = getTeamAllocations() || [];
      const teamAllocations = allAllocations.filter(
        (a) =>
          (a.team && a.team.toLowerCase() === selectedTeamName.toLowerCase()) ||
          (a.teamName &&
            a.teamName.toLowerCase() === selectedTeamName.toLowerCase())
      );

      const allMissions = getMissions() || [];

      setTasks(teamTasks);
      setAllocations(teamAllocations);
      setMissions(allMissions);
    } catch (err) {
      console.error("Failed to load team report data:", err);
      setTasks([]);
      setAllocations([]);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTeamName]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [selectedTeamName]);

  // Phase 6: Volume-Weighted Team Aggregation Calculation
  const teamAggregate = useMemo(() => {
    const aggregated = aggregateTeamScores(tasks, [activeTeam]);
    return (
      aggregated[0] || {
        score: 0,
        volume: 0,
        timeliness: 0,
        quality: 0,
        complexity: 0,
        memberBreakdown: [],
        bottleneckAlert: null,
        redistributionRecommendation: null,
      }
    );
  }, [tasks, activeTeam]);

  // Target vs Actual Metrics
  const quotaTarget = allocations.reduce(
    (sum, a) => sum + Number(a.allocatedTarget || a.target || 0),
    0
  );
  const verifiedActual = tasks
    .filter((t) => String(t.status || "").toLowerCase() === "completed")
    .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 0), 0);

  const targetProgress =
    quotaTarget > 0
      ? Math.min(100, Math.round((verifiedActual / quotaTarget) * 100))
      : 0;

  const filteredMembers = useMemo(() => {
    const list = teamAggregate.memberBreakdown || [];
    if (!search) return list;
    return list.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [teamAggregate.memberBreakdown, search]);

  const handleExportJSON = () => {
    const data = {
      teamName: activeTeam.name,
      organization: activeTeam.organization,
      supervisor: activeTeam.lead,
      generatedAt: new Date().toISOString(),
      performanceSummary: {
        volumeWeightedTeamScore: teamAggregate.score,
        targetQuota: quotaTarget,
        verifiedDelivered: verifiedActual,
        achievementRate: `${targetProgress}%`,
        volume: teamAggregate.volume,
        timeliness: teamAggregate.timeliness,
        quality: teamAggregate.quality,
        complexity: teamAggregate.complexity,
      },
      bottleneckAnalysis: {
        alert: teamAggregate.bottleneckAlert || "None",
        recommendation: teamAggregate.redistributionRecommendation || "Optimal distribution",
      },
      officerRoster: (teamAggregate.memberBreakdown || []).map((m) => ({
        officer: m.name,
        score: m.score,
        volume: m.volume,
        timeliness: m.timeliness,
        quality: m.quality,
        complexity: m.complexity,
        completedTasks: m.completedCount,
        pendingTasks: m.pendingCount,
        overdueTasks: m.overdueCount,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Team_Efficiency_Audit_${activeTeam.name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Phase 6 • Team Efficiency Aggregations
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {activeTeam.name} Efficiency Audit
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Volume-weighted bottom-up efficiency index, deliverable completion velocity, and bottleneck alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Team Switcher Pill */}
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
            onClick={loadData}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportJSON}
            icon={<Download size={14} />}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* PHASE 6 BOTTLENECK & RECOMMENDATION BANNER */}
      {teamAggregate.bottleneckAlert && (
        <div className="mb-7 p-4 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>Bottleneck Alert: {teamAggregate.bottleneckAlert}</span>
          </div>

          {teamAggregate.redistributionRecommendation && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-amber-200/80 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Sparkles size={14} className="text-[#154B38] shrink-0" />
                <span>
                  <b>Actionable Recommendation:</b> {teamAggregate.redistributionRecommendation}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/team/dashboard")}
                icon={<ArrowRight size={13} />}
              >
                Open Redistribution Desk
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Team Efficiency Score"
          value={`${teamAggregate.score} Index`}
          change="Volume-weighted employee roll-up"
        />
        <StatCard
          title="Target vs Delivered"
          value={`${verifiedActual.toLocaleString()} / ${
            quotaTarget > 0 ? quotaTarget.toLocaleString() : tasks.length
          }`}
          change={`${targetProgress}% mandate completed`}
          changeType={targetProgress >= 70 ? "positive" : "neutral"}
        />
        <StatCard
          title="Active Officers"
          value={teamAggregate.memberBreakdown?.length || 0}
          change="Contributing to queue"
          changeType="positive"
        />
        <StatCard
          title="Overdue Tasks"
          value={teamAggregate.overdueTasks || 0}
          change={
            teamAggregate.overdueTasks > 0
              ? "Requires supervisor rebalancing"
              : "Zero SLA breaches"
          }
          changeType={teamAggregate.overdueTasks > 0 ? "negative" : "positive"}
        />
      </div>

      {/* 4-FACTOR PILLARS & WEIGHTED FORMULA CARD */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-7">
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
                  <Gauge size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Volume-Weighted Efficiency Roll-up
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Score = Sum(Officer Score × Completed Tasks) / Total Completed Tasks
                  </p>
                </div>
              </div>
              <Badge variant="sage">{teamAggregate.score} / 100</Badge>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Volume Output</span>
                  <span className="font-bold text-slate-900">{teamAggregate.volume}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#154B38] transition-all"
                    style={{ width: `${teamAggregate.volume}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Timeliness SLA</span>
                  <span className="font-bold text-slate-900">{teamAggregate.timeliness}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1E654C] transition-all"
                    style={{ width: `${teamAggregate.timeliness}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Quality / First-Pass Sign-off</span>
                  <span className="font-bold text-slate-900">{teamAggregate.quality}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#38A57F] transition-all"
                    style={{ width: `${teamAggregate.quality}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Complexity Index</span>
                  <span className="font-bold text-slate-900">{teamAggregate.complexity}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#2D7D60] transition-all"
                    style={{ width: `${teamAggregate.complexity}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Aggregated Across: <b>{teamAggregate.memberBreakdown?.length || 0} Officers</b></span>
            <span className="font-bold text-[#154B38]">Pure Mathematical Roll-Up</span>
          </div>
        </Card>

        {/* Target vs Actual Deliverable Fulfillment Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Target vs Verified Completion Progress
            </h3>
            <p className="text-xs text-slate-400 font-medium mb-5">
              Fulfillment of cascaded quota ({quotaTarget.toLocaleString()} units).
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAFCFB] border border-slate-200/80">
                <div className="flex justify-between items-center text-xs mb-2 font-bold">
                  <span className="text-slate-700">Deliverable Achievement</span>
                  <span className="text-sm font-extrabold text-[#154B38]">
                    {verifiedActual.toLocaleString()} / {quotaTarget.toLocaleString()} units ({targetProgress}%)
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-[#154B38] transition-all duration-500"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Remaining Quota
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    {Math.max(0, quotaTarget - verifiedActual).toLocaleString()} units
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Queue Velocity
                  </span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {teamAggregate.completedTasks || 0} tasks cleared
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 text-xs text-slate-500 flex items-center justify-between pt-3 border-t border-slate-100">
            <span>
              Supervisor: <b className="text-slate-800">{activeTeam.lead}</b>
            </span>
            <span>
              Agency: <b className="text-slate-800">{activeTeam.organization}</b>
            </span>
          </div>
        </Card>
      </div>

      {/* MEMBER OFFICERS PERFORMANCE TABLE (PHASE 6 SPEC REQUIREMENT) */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Team Member Contribution Ledger ({filteredMembers.length})
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Individual officer performance scores weighted into the team roll-up.
            </p>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team officers..."
              className="w-48 sm:w-56 rounded-full border border-slate-200/90 bg-[#F4F6F8] py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#154B38]"
            />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <p className="font-bold text-slate-700">No member tasks logged</p>
            <p className="mt-0.5">Assign tasks in Team Directives to view member efficiency.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  <th className="pb-3 pr-4">Officer Name</th>
                  <th className="pb-3 px-4">Tasks Completed</th>
                  <th className="pb-3 px-4">Volume (V)</th>
                  <th className="pb-3 px-4">Timeliness (T)</th>
                  <th className="pb-3 px-4">Quality (Q)</th>
                  <th className="pb-3 px-4">Complexity (X)</th>
                  <th className="pb-3 px-4">Overall Score</th>
                  <th className="pb-3 pl-4 text-right">Capacity / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredMembers.map((m) => {
                  const hasCapacity = m.pendingCount <= 3;
                  const isBehind = m.overdueCount > 0;

                  return (
                    <tr key={m.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pr-4 font-bold text-slate-900">
                        {m.name}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-800">
                        {m.completedCount} / {m.tasks?.length || 0}
                      </td>
                      <td className="py-3.5 px-4">{m.volume}%</td>
                      <td className="py-3.5 px-4">{m.timeliness}%</td>
                      <td className="py-3.5 px-4">{m.quality}%</td>
                      <td className="py-3.5 px-4 text-purple-700 font-bold">{m.complexity}%</td>
                      <td className="py-3.5 px-4 font-extrabold text-sm text-[#154B38]">
                        {m.score} / 100
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        {isBehind ? (
                          <span className="rounded-full bg-rose-50 text-rose-700 px-2.5 py-0.5 text-[10px] font-bold border border-rose-200">
                            {m.overdueCount} Overdue
                          </span>
                        ) : hasCapacity ? (
                          <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-200">
                            Available Capacity
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[10px] font-semibold">
                            Normal Load
                          </span>
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
    </DashboardLayout>
  );
};

export default TeamReports;