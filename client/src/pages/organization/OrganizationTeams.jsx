import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  UserRound,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Search,
  RefreshCw,
  Plus,
  X,
  Target,
  ArrowUpRight,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

import {
  getOrganizationAllocations,
  getTeamAllocationsByOrganization,
  createTeamAllocation,
  getTasks,
} from "../../utils/localStorage";
import { getOrganizations, getTeams } from "../../data/hierarchy";

const OrganizationTeams = () => {
  const organizations = useMemo(() => getOrganizations(), []);
  const teams = useMemo(() => {
    return getTeams().map((t) => ({
      ...t,
      employees: t.baseOfficers || 6,
      lead: t.supervisor || t.lead || "Supervisor",
    }));
  }, []);

  const [organizationName, setOrganizationName] = useState(() => getOrganizations()[0]?.name || "Scholarship Services");
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    try {
      const allTeamAlloc = getTeamAllocationsByOrganization(organizationName) || [];
      setTeamAllocations(allTeamAlloc);

      const allTasks = getTasks() || [];
      const orgTasks = allTasks.filter((t) => t.organization === organizationName);
      setTasks(orgTasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("governscale-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("governscale-data-updated", handleUpdate);
    };
  }, [organizationName]);

  const currentTeams = useMemo(() => {
    return teams.filter((t) => t.organization === organizationName);
  }, [organizationName]);

  const filteredTeams = useMemo(() => {
    return currentTeams.filter((t) => {
      return !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.lead.toLowerCase().includes(search.toLowerCase());
    });
  }, [currentTeams, search]);

  const totalEmployees = currentTeams.reduce((sum, t) => sum + t.employees, 0);
  const completedTasksCount = tasks.filter((t) => String(t.status || "").toLowerCase() === "completed").length;
  const operationalSLA = tasks.length > 0 ? `${Math.round((completedTasksCount / tasks.length) * 100)}%` : "0%";

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Workforce Units
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Organization Teams
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Manage functional teams operating under {organizationName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white p-1 shadow-2xs">
            {organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setOrganizationName(org.name)}
                className={`
                  rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer
                  ${
                    organizationName === org.name
                      ? "bg-[#154B38] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                {org.name}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={loadData} loading={loading} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Active Teams"
          value={currentTeams.length}
          change={`Units in ${organizationName}`}
        />
        <StatCard
          title="Assigned Staff"
          value={totalEmployees}
          change="Officers assigned"
          changeType="positive"
        />
        <StatCard
          title="Team Directives"
          value={teamAllocations.length}
          change={teamAllocations.length > 0 ? "Cascaded allocations" : "No active directives"}
          changeType="neutral"
        />
        <StatCard
          title="Operational SLA"
          value={operationalSLA}
          change={tasks.length > 0 ? "Target compliance" : "No active tasks"}
          changeType={completedTasksCount > 0 ? "positive" : "neutral"}
        />
      </div>

      {/* SEARCH BAR */}
      <Card className="mb-7 p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams by name or lead..."
            className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
          />
        </div>
      </Card>

      {/* TEAM CARDS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredTeams.map((team) => {
          const teamAllocs = teamAllocations.filter((a) => a.team === team.name);
          const totalTarget = teamAllocs.reduce((sum, a) => sum + Number(a.allocatedTarget || a.target || 0), 0);
          const teamTasks = tasks.filter((t) => t.team === team.name);
          const completed = teamTasks.filter((t) => String(t.status).toLowerCase() === "completed").length;
          const prog = teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 0;

          return (
            <Card key={team.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBF6F0] text-[#154B38]">
                      <Users size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{team.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">Lead: {team.lead}</p>
                    </div>
                  </div>
                  <Badge variant="sage">{team.employees} Officers</Badge>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-[#F4F6F8] border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Target</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{totalTarget.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F4F6F8] border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Deliverables</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{teamTasks.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F4F6F8] border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Completed</span>
                    <p className="font-extrabold text-emerald-700 mt-0.5">{completed}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Task Completion</span>
                    <span className="font-bold text-slate-900">{prog}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#154B38] transition-all"
                      style={{ width: `${prog}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{team.organization}</span>
                <button
                  type="button"
                  onClick={() => window.alert(`Team: ${team.name}\nLead: ${team.lead}\nAllocations: ${teamAllocs.length}`)}
                  className="flex items-center gap-1 text-xs font-bold text-[#154B38] hover:underline cursor-pointer"
                >
                  <span>Team Directives</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default OrganizationTeams;