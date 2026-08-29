import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  UserRound,
  Building2,
  Network,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Search,
  Briefcase,
  ArrowUpRight,
  Plus,
  RefreshCw,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import { getTasks } from "../../utils/localStorage";
import {
  getEmployees,
  getDepartmentNames,
  getOrganizationNames,
} from "../../data/hierarchy";

const GovernmentEmployees = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [organizationFilter, setOrganizationFilter] = useState("All Organizations");

  const BASE_EMPLOYEES = useMemo(() => getEmployees(), []);
  const DEPARTMENTS = useMemo(() => ["All Departments", ...getDepartmentNames()], []);
  const ORGANIZATIONS = useMemo(() => ["All Organizations", ...getOrganizationNames()], []);

  const loadData = () => {
    setLoading(true);
    try {
      const allTasks = getTasks() || [];
      setTasks(allTasks);
    } catch (err) {
      console.error("Failed to load government employees:", err);
      setTasks([]);
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

  const employees = useMemo(() => {
    return BASE_EMPLOYEES.map((emp) => {
      const empTasks = tasks.filter(
        (t) =>
          (t.employeeName || t.assignedTo) === emp.name ||
          t.employeeId === emp.id
      );

      const taskCount = empTasks.length;
      const completedCount = empTasks.filter(
        (t) => String(t.status || "").toLowerCase() === "completed"
      ).length;
      const pendingCount = empTasks.filter((t) =>
        ["pending", "in progress", "pending verification", "submitted"].includes(
          String(t.status || "").toLowerCase()
        )
      ).length;
      const prog = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

      return {
        ...emp,
        tasks: taskCount,
        completed: completedCount,
        pending: pendingCount,
        progress: prog,
      };
    });
  }, [tasks]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        !search ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.role.toLowerCase().includes(search.toLowerCase());

      const matchDept =
        departmentFilter === "All Departments" ||
        emp.department === departmentFilter;

      const matchOrg =
        organizationFilter === "All Organizations" ||
        emp.organization === organizationFilter;

      return matchSearch && matchDept && matchOrg;
    });
  }, [employees, search, departmentFilter, organizationFilter]);

  const totalTasks = employees.reduce((sum, e) => sum + e.tasks, 0);
  const totalCompleted = employees.reduce((sum, e) => sum + e.completed, 0);
  const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Statewide Workforce Directory
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Government Employees
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Cross-departmental civil service directory and active deliverable progress.
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
            onClick={() => window.alert("Civil servant directory export initiated.")}
            icon={<Plus size={16} />}
          >
            Add Officer
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Statewide Staff"
          value={employees.length}
          change="Civil servants on roster"
        />
        <StatCard
          title="Assigned Tasks"
          value={totalTasks}
          change={totalTasks > 0 ? "Deliverables in progress" : "No active tasks"}
          changeType="neutral"
        />
        <StatCard
          title="Verified Outputs"
          value={totalCompleted}
          change={totalTasks > 0 ? `${overallRate}% verified rate` : "0% verified"}
          changeType={totalCompleted > 0 ? "positive" : "neutral"}
        />
        <StatCard
          title="Presence SLA"
          value="100%"
          change="Verified presence"
          changeType="positive"
        />
      </div>

      {/* SEARCH + FILTER */}
      <Card className="mb-7 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search officer by name or role..."
              className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 text-[11px] uppercase">Dept:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
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
        </div>
      </Card>

      {/* DIRECTORY TABLE */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-4 pl-6 pr-4">Officer</th>
                <th className="py-4 px-4">Department</th>
                <th className="py-4 px-4">Organization / Team</th>
                <th className="py-4 px-4 text-center">Tasks</th>
                <th className="py-4 px-4">Progress</th>
                <th className="py-4 pr-6 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EBF6F0] text-xs font-bold text-[#154B38] shadow-2xs">
                        {emp.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{emp.name}</p>
                        <p className="text-[10px] text-slate-400">{emp.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    {emp.department}
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-800">{emp.organization}</p>
                    <p className="text-[10px] text-slate-400">{emp.team}</p>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-900">
                    {emp.completed} / {emp.tasks}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#154B38]"
                          style={{ width: `${emp.progress}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-8">{emp.progress}%</span>
                    </div>
                  </td>
                  <td className="py-4 pr-6 pl-4 text-right">
                    <Badge variant={emp.tasks > 0 && emp.completed === emp.tasks ? "completed" : emp.tasks > 0 ? "warning" : "default"}>
                      {emp.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default GovernmentEmployees;