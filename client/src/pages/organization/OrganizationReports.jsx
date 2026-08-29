import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  Eye,
  CalendarDays,
  BarChart3,
  ClipboardList,
  Building2,
  Users,
  CheckCircle2,
  Clock3,
  Search,
  X,
  Target,
  AlertTriangle,
  RefreshCw,
  UserRound,
  Award,
  Sparkles,
  Gauge,
  TrendingUp,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getMissions,
  getOrganizationAllocations,
  getTeamAllocations,
  getTasks,
} from "../../utils/localStorage";
import { getOrganizations, getTeams } from "../../data/hierarchy";
import { aggregateOrganizationScores } from "../../utils/scoringEngine";

const OrganizationReports = () => {
  const organizations = useMemo(() => getOrganizations(), []);
  const allTeams = useMemo(() => getTeams(), []);
  const [selectedOrgName, setSelectedOrgName] = useState(
    () => getOrganizations()[0]?.name || "Scholarship Services"
  );
  const [missions, setMissions] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const currentOrg = useMemo(() => {
    return (
      organizations.find((o) => o.name === selectedOrgName) || organizations[0]
    );
  }, [selectedOrgName, organizations]);

  const loadData = () => {
    setLoading(true);
    try {
      const allMissions = getMissions() || [];
      const allAllocations = getOrganizationAllocations() || [];
      const allTasks = getTasks() || [];

      const orgTasks = allTasks.filter(
        (t) =>
          t.organization === selectedOrgName ||
          (t.department === currentOrg?.department && !t.organization)
      );

      const orgAllocations = allAllocations.filter(
        (a) => a.organization === selectedOrgName
      );

      setMissions(allMissions);
      setAllocations(orgAllocations);
      setTasks(orgTasks);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedOrgName]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [selectedOrgName]);

  // Phase 7: Team-Volume-Weighted Organization Aggregation
  const orgAggregate = useMemo(() => {
    const orgsData = aggregateOrganizationScores(
      tasks,
      currentOrg ? [currentOrg] : [],
      allTeams.filter((t) => t.organization === selectedOrgName)
    );
    return (
      orgsData[0] || {
        score: 0,
        volume: 0,
        timeliness: 0,
        quality: 0,
        complexity: 0,
        teamLeaderboard: [],
        interTeamBottleneck: null,
      }
    );
  }, [tasks, currentOrg, allTeams, selectedOrgName]);

  const quotaTarget = allocations.reduce(
    (sum, a) => sum + Number(a.allocatedTarget || a.target || 0),
    0
  );
  const verifiedActual = tasks
    .filter((t) => String(t.status).toLowerCase() === "completed")
    .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);

  const completionRate =
    quotaTarget > 0
      ? Math.min(100, Math.round((verifiedActual / quotaTarget) * 100))
      : 0;

  const handleDownload = () => {
    const data = {
      organization: currentOrg.name,
      department: currentOrg.department,
      director: currentOrg.head || "Agency Director",
      generatedAt: new Date().toISOString(),
      efficiencySummary: {
        volumeWeightedScore: orgAggregate.score,
        targetQuota: quotaTarget,
        verifiedDelivered: verifiedActual,
        achievementRate: `${completionRate}%`,
        volume: orgAggregate.volume,
        timeliness: orgAggregate.timeliness,
        quality: orgAggregate.quality,
        complexity: orgAggregate.complexity,
      },
      teamLeaderboard: (orgAggregate.teamLeaderboard || []).map((t) => ({
        rank: t.rankLabel,
        teamName: t.name,
        efficiencyScore: t.score,
        completedTasks: t.completedTasks || 0,
        timeliness: t.timeliness,
        quality: t.quality,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title || t.name,
        team: t.team,
        status: t.status,
        target: t.target || 1,
        verifiedTarget: t.verifiedTarget || 0,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Agency_Efficiency_Audit_${currentOrg.name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            {currentOrg?.department} • Phase 7 Agency Audit
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {currentOrg.name} Reports & Audit
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Agency compliance audit documentation and constituent team performance roll-up.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Org Selector Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Building2 size={14} className="text-[#154B38]" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">
              Agency:
            </span>
            <select
              value={selectedOrgName}
              onChange={(e) => setSelectedOrgName(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.name}>
                  {org.name}
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
            onClick={handleDownload}
            icon={<Download size={14} />}
          >
            Export JSON Audit
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Agency Efficiency Score"
          value={`${orgAggregate.score} Index`}
          change="Volume-weighted team roll-up"
        />
        <StatCard
          title="Target vs Actual"
          value={`${verifiedActual.toLocaleString()} / ${
            quotaTarget > 0 ? quotaTarget.toLocaleString() : tasks.length
          }`}
          change={`${completionRate}% delivered`}
          changeType={completionRate >= 70 ? "positive" : "neutral"}
        />
        <StatCard
          title="Active Teams"
          value={orgAggregate.teamLeaderboard?.length || 1}
          change="Operational working units"
          changeType="positive"
        />
        <StatCard
          title="Verified Outputs"
          value={orgAggregate.completedTasks || 0}
          change="Cleared deliverables"
          changeType="positive"
        />
      </div>

      {/* TEAM COMPARISON TABLE */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Constituent Team Performance Ledger
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Ranked team scores weighted into the {currentOrg.name} roll-up.
            </p>
          </div>
        </div>

        {orgAggregate.teamLeaderboard?.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No active teams logged for {currentOrg.name}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  <th className="pb-3 pr-4">Rank</th>
                  <th className="pb-3 px-4">Working Team</th>
                  <th className="pb-3 px-4">Supervisor</th>
                  <th className="pb-3 px-4">Completed Volume</th>
                  <th className="pb-3 px-4">Volume (V)</th>
                  <th className="pb-3 px-4">Timeliness (T)</th>
                  <th className="pb-3 px-4">Quality (Q)</th>
                  <th className="pb-3 pl-4 text-right">Team Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orgAggregate.teamLeaderboard.map((team) => (
                  <tr key={team.name} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pr-4 font-extrabold text-[#154B38]">
                      {team.rankLabel}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {team.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{team.lead}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-800">
                      {team.completedTasks || 0} / {team.totalTasks || 0}
                    </td>
                    <td className="py-3.5 px-4">{team.volume}%</td>
                    <td className="py-3.5 px-4">{team.timeliness}%</td>
                    <td className="py-3.5 px-4">{team.quality}%</td>
                    <td className="py-3.5 pl-4 text-right font-extrabold text-sm text-[#154B38]">
                      {team.score} / 100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default OrganizationReports;