import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserRound,
  Building2,
  Briefcase,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Search,
  RefreshCw,
  Target,
  Eye,
  X,
  ListTodo,
  ShieldCheck,
  Plus,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getTasks,
  getTeamAllocations,
  updateTask,
} from "../../utils/localStorage";
import { getTeams, getEmployees } from "../../data/hierarchy";

const TeamEmployees = () => {
  const [selectedTeamName, setSelectedTeamName] = useState(() => getTeams()[0]?.name || "Scholarship Verification Team");
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  const BASE_OFFICERS = useMemo(() => getEmployees(), []);

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
        if (tName && !list.some((t) => t.name.toLowerCase() === tName.toLowerCase())) {
          list.push({
            name: tName,
            organization: a.organization || "General Agency",
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
          (t.teamName && t.teamName.toLowerCase() === selectedTeamName.toLowerCase()) ||
          (t.assignedTeam && t.assignedTeam.toLowerCase() === selectedTeamName.toLowerCase())
      );
      setTasks(teamTasks);
    } finally {
      setLoading(false);
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

  const employeeStats = useMemo(() => {
    return BASE_OFFICERS.map((emp) => {
      const empTasks = tasks.filter(
        (t) => (t.employeeName || t.assignedTo) === emp.name || t.employeeId === emp.id
      );
      const totalAssigned = empTasks.reduce((sum, t) => sum + Number(t.target || 1), 0);
      const completed = empTasks
        .filter((t) => String(t.status).toLowerCase() === "completed")
        .reduce((sum, t) => sum + Number(t.verifiedTarget || t.target || 1), 0);
      const pendingVerification = empTasks.filter((t) =>
        ["pending verification", "submitted"].includes(String(t.status).toLowerCase())
      ).length;

      return {
        ...emp,
        organization: activeTeam.organization,
        team: activeTeam.name,
        tasks: empTasks,
        tasksCount: empTasks.length,
        totalAssigned,
        completed,
        pendingVerification,
        rate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0,
      };
    });
  }, [tasks, activeTeam]);

  const filteredEmployees = useMemo(() => {
    return employeeStats.filter((e) => {
      return !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase());
    });
  }, [employeeStats, search]);

  const totalAssignedTeam = employeeStats.reduce((sum, e) => sum + e.totalAssigned, 0);
  const totalVerifiedTeam = employeeStats.reduce((sum, e) => sum + e.completed, 0);

  const handleVerifyTask = (task) => {
    try {
      updateTask(task.id, {
        status: "Completed",
        verificationStatus: "Approved",
        verifiedByTeam: true,
        teamVerified: true,
        verifiedForOrganization: true,
        verifiedTarget: Number(task.target || 1),
        verifiedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
      loadData();
      window.dispatchEvent(new Event("governscale-data-updated"));
      window.alert(`Task "${task.title || task.name}" verified successfully! Deliverable progress has rolled up to upper tiers.`);
      if (selectedEmployee) {
        // Refresh selected employee tasks
        const updatedTasks = getTasks().filter(
          (t) => (t.employeeName || t.assignedTo) === selectedEmployee.name || t.employeeId === selectedEmployee.id
        );
        setSelectedEmployee((prev) => prev ? { ...prev, tasks: updatedTasks } : null);
      }
    } catch (err) {
      console.error("Failed to verify task:", err);
    }
  };

  return (
    <DashboardLayout>
      {/* HEADER WITH TEAM SELECTOR */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            {activeTeam.organization}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {activeTeam.name} Officers
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Officer workload distribution, verified target output, and submission records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Team Switcher Dropdown Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Users size={14} className="text-[#154B38]" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">Team:</span>
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

          <Button variant="secondary" size="sm" onClick={loadData} loading={loading} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Team Officers"
          value={BASE_OFFICERS.length}
          change="Active verification staff"
        />
        <StatCard
          title="Assigned Tasks"
          value={tasks.length}
          change="Operational queue"
          changeType="neutral"
        />
        <StatCard
          title="Target Volume"
          value={totalAssignedTeam.toLocaleString()}
          change="Units delegated"
          changeType="neutral"
        />
        <StatCard
          title="Verified Outputs"
          value={totalVerifiedTeam.toLocaleString()}
          change={`${totalAssignedTeam > 0 ? Math.round((totalVerifiedTeam / totalAssignedTeam) * 100) : 0}% team completion`}
          changeType="positive"
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
            placeholder="Search officers by name or role..."
            className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
          />
        </div>
      </Card>

      {/* EMPLOYEE TABLE */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="pb-3 pr-4">Officer Name</th>
                <th className="pb-3 px-4">Role</th>
                <th className="pb-3 px-4">Active Tasks</th>
                <th className="pb-3 px-4">Target Units</th>
                <th className="pb-3 px-4">Verified Done</th>
                <th className="pb-3 px-4">Completion Rate</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 pr-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-[#EBF6F0] text-[#154B38] font-bold text-xs flex items-center justify-center">
                      {emp.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span>{emp.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{emp.role}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{emp.tasksCount}</td>
                  <td className="py-3.5 px-4 text-slate-600">{emp.totalAssigned}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">{emp.completed}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#154B38]"
                          style={{ width: `${emp.rate}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{emp.rate}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(emp)}
                      className="text-xs font-bold text-[#154B38] hover:underline cursor-pointer"
                    >
                      Audit Tasks
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* OFFICER TASKS AUDIT MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 card-soft-shadow shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedEmployee.name}'s Tasks
                </h3>
                <p className="text-xs text-slate-400">{selectedEmployee.role} • {activeTeam.name}</p>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 mb-6">
              {selectedEmployee.tasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No tasks assigned to this officer.</p>
              ) : (
                selectedEmployee.tasks.map((t, idx) => {
                  const isDone = String(t.status).toLowerCase() === "completed";
                  const isPendingReview = ["pending verification", "submitted"].includes(String(t.status).toLowerCase());

                  return (
                    <div key={t.id || idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{t.title || t.name}</p>
                        <p className="text-[10px] text-slate-400">Target: {t.target || 1} units • Due {t.dueDate || "Ongoing"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={isDone ? "completed" : isPendingReview ? "warning" : "default"}>
                          {t.status || "Pending"}
                        </Badge>
                        {isPendingReview && (
                          <button
                            type="button"
                            onClick={() => handleVerifyTask(t)}
                            className="rounded-full bg-[#154B38] px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[#0D3427] cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedEmployee(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeamEmployees;