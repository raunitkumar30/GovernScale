import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Building2,
  UserRound,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Search,
  ChevronRight,
  ArrowUpRight,
  Plus,
  RefreshCw,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getTasks,
  getTeamAllocations,
} from "../../utils/localStorage";
import { getTeams, getOrganizationNames } from "../../data/hierarchy";

const DepartmentTeams = () => {
  const [tasks, setTasks] = useState([]);
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("All Organizations");

  const BASE_TEAMS = useMemo(() => {
    return getTeams().map((t) => ({
      ...t,
      lead: t.supervisor || t.lead || "Supervisor",
    }));
  }, []);

  const ORGANIZATIONS = useMemo(() => ["All Organizations", ...getOrganizationNames()], []);

  const loadData = () => {
    setLoading(true);
    try {
      const allTasks = getTasks() || [];
      const allAllocations = getTeamAllocations() || [];
      setTasks(allTasks);
      setTeamAllocations(allAllocations);
    } catch (err) {
      console.error("Failed to load department teams:", err);
      setTasks([]);
      setTeamAllocations([]);
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

  // Dynamically compute tasks, targets, and completions for each team from localStorage
  const teams = useMemo(() => {
    return BASE_TEAMS.map((team) => {
      const teamTasks = tasks.filter(
        (t) => t.team === team.name || t.teamName === team.name
      );

      const teamAllocs = teamAllocations.filter(
        (a) => a.team === team.name || a.teamName === team.name
      );

      const totalTarget = teamAllocs.reduce(
        (sum, a) => sum + Number(a.allocatedTarget || a.target || 0),
        0
      );

      const taskCount = teamTasks.length;
      const completedCount = teamTasks.filter(
        (t) => String(t.status || "").toLowerCase() === "completed"
      ).length;

      const pendingCount = teamTasks.filter((t) =>
        ["pending", "in progress", "pending verification", "submitted"].includes(
          String(t.status || "").toLowerCase()
        )
      ).length;

      const overdueCount = teamTasks.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return (
          !isNaN(d.getTime()) &&
          d < new Date() &&
          String(t.status || "").toLowerCase() !== "completed"
        );
      }).length;

      const officersSet = new Set();
      teamTasks.forEach((t) => {
        const name = t.employeeName || t.assignedTo;
        if (name) officersSet.add(name);
      });

      const prog =
        taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

      return {
        ...team,
        employees: officersSet.size,
        totalTasks: taskCount,
        completed: completedCount,
        pending: pendingCount,
        overdue: overdueCount,
        target: totalTarget,
        progress: prog,
      };
    });
  }, [tasks, teamAllocations]);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchSearch =
        !search ||
        team.name.toLowerCase().includes(search.toLowerCase()) ||
        team.lead.toLowerCase().includes(search.toLowerCase());

      const matchOrg =
        organizationFilter === "All Organizations" ||
        team.organization === organizationFilter;

      return matchSearch && matchOrg;
    });
  }, [teams, search, organizationFilter]);

  const totalEmployees = teams.reduce((sum, t) => sum + t.employees, 0);
  const totalTasks = teams.reduce((sum, t) => sum + t.totalTasks, 0);
  const totalCompleted = teams.reduce((sum, t) => sum + t.completed, 0);
  const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Department Working Groups
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Department Teams
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Operational teams executing delegated department deliverables.
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
            onClick={() => window.alert("Team registration wizard active.")}
            icon={<Plus size={16} />}
          >
            Add Team
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Total Teams"
          value={teams.length}
          change="Operational working groups"
        />
        <StatCard
          title="Active Officers"
          value={`${totalEmployees} Staff`}
          change={totalEmployees > 0 ? "Assigned frontline staff" : "No staff assigned"}
          changeType={totalEmployees > 0 ? "positive" : "neutral"}
        />
        <StatCard
          title="Deliverable Tasks"
          value={totalTasks}
          change={totalTasks > 0 ? "Assigned workload" : "No active tasks"}
          changeType="neutral"
        />
        <StatCard
          title="Verified Outputs"
          value={totalCompleted}
          change={totalTasks > 0 ? `${overallRate}% verified` : "0% completion"}
          changeType={totalCompleted > 0 ? "positive" : "neutral"}
        />
      </div>

      {/* SEARCH + ORG FILTER */}
      <Card className="mb-7 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by team or lead..."
              className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400 text-[11px] uppercase">Org:</span>
            <select
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              {ORGANIZATIONS.map((org) => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* TEAM CARDS GRID */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{team.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{team.organization}</p>
                  </div>
                </div>
                <Badge variant="sage">{team.employees} Staff</Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-[#F4F6F8]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Tasks</span>
                  <p className="font-extrabold text-slate-900 mt-0.5">{team.totalTasks}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F4F6F8]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Done</span>
                  <p className="font-extrabold text-emerald-700 mt-0.5">{team.completed}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F4F6F8]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pending</span>
                  <p className="font-extrabold text-amber-700 mt-0.5">{team.pending}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Task Completion</span>
                  <span className="font-bold text-slate-900">{team.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#154B38] transition-all"
                    style={{ width: `${team.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[140px]">Lead: <b className="text-slate-800">{team.lead}</b></span>
              <button
                type="button"
                onClick={() => window.alert(`Team: ${team.name}\nOrganization: ${team.organization}\nTasks: ${team.totalTasks}\nCompleted: ${team.completed}`)}
                className="font-bold text-[#154B38] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Details</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DepartmentTeams;