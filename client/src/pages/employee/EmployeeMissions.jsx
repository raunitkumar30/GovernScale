import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Target,
  CalendarDays,
  ListChecks,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ArrowRight,
  UserRound,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

import {
  getMissions,
  getTasks,
  getEmployeeAllocations,
} from "../../utils/localStorage";
import { getEmployees } from "../../data/hierarchy";

const EmployeeMissions = () => {
  const navigate = useNavigate();
  const DEMO_EMPLOYEES = useMemo(() => getEmployees(), []);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(() => getEmployees()[0]?.id || "emp_001");
  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const currentEmployee =
    DEMO_EMPLOYEES.find((e) => e.id === selectedEmployeeId) || DEMO_EMPLOYEES[0];

  const loadData = () => {
    setLoading(true);
    try {
      const allMissions = getMissions() || [];
      const allTasks = getTasks() || [];
      const allAllocations = getEmployeeAllocations() || [];

      // Filter tasks belonging to current employee
      const myTasks = allTasks.filter(
        (t) =>
          (t.employeeId || t.assignedTo) === currentEmployee.id ||
          (t.employeeName || t.assignedTo) === currentEmployee.name
      );

      // Filter allocations belonging to current employee
      const myAllocations = allAllocations.filter(
        (a) =>
          (a.employeeId || a.employee) === currentEmployee.id ||
          a.employee === currentEmployee.name
      );

      setMissions(allMissions);
      setTasks(myTasks);
      setAllocations(myAllocations);
    } catch (err) {
      console.error("Failed to load employee missions:", err);
      setMissions([]);
      setTasks([]);
      setAllocations([]);
    } finally {
      setLoading(false);
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

  // Derive the assigned missions strictly from employee tasks and allocations
  const assignedMissions = useMemo(() => {
    const missionIdMap = new Map();

    // Add missions referenced by officer's tasks
    tasks.forEach((t) => {
      if (t.missionId) {
        if (!missionIdMap.has(String(t.missionId))) {
          missionIdMap.set(String(t.missionId), []);
        }
        missionIdMap.get(String(t.missionId)).push(t);
      }
    });

    // Add missions referenced by officer's allocations
    allocations.forEach((a) => {
      if (a.missionId && !missionIdMap.has(String(a.missionId))) {
        missionIdMap.set(String(a.missionId), []);
      }
    });

    // If no tasks or allocations are assigned to this employee, return empty array
    if (missionIdMap.size === 0) {
      return [];
    }

    return Array.from(missionIdMap.entries())
      .map(([missionId, officerTasks]) => {
        const parentMission = missions.find((m) => String(m.id) === String(missionId));

        if (!parentMission && officerTasks.length === 0) {
          return null;
        }

        const totalOfficerTasks = officerTasks.length;
        const completedOfficerTasks = officerTasks.filter(
          (t) => String(t.status).toLowerCase() === "completed"
        ).length;
        const pendingOfficerTasks = officerTasks.filter((t) =>
          ["pending", "in progress"].includes(String(t.status).toLowerCase())
        ).length;
        const overdueOfficerTasks = officerTasks.filter((t) => {
          if (!t.dueDate) return false;
          const d = new Date(t.dueDate);
          return !isNaN(d.getTime()) && d < new Date() && String(t.status).toLowerCase() !== "completed";
        }).length;

        const calculatedProgress =
          totalOfficerTasks > 0
            ? Math.round((completedOfficerTasks / totalOfficerTasks) * 100)
            : 0;

        return {
          id: missionId,
          title: parentMission?.title || `Directive #${missionId}`,
          description:
            parentMission?.description ||
            "Assigned state directive with operational tasks allocated to you.",
          status: parentMission?.status || (completedOfficerTasks === totalOfficerTasks && totalOfficerTasks > 0 ? "Completed" : "Active"),
          priority: parentMission?.priority || "Medium",
          progress: calculatedProgress,
          deadline: parentMission?.deadline || "Ongoing",
          tasks: totalOfficerTasks,
          completed: completedOfficerTasks,
          pending: pendingOfficerTasks,
          overdue: overdueOfficerTasks,
          team: parentMission?.departments?.[0] || "Assigned Unit",
        };
      })
      .filter(Boolean);
  }, [missions, tasks, allocations]);

  const filteredMissions = useMemo(() => {
    return assignedMissions.filter((mission) => {
      const matchesSearch =
        !search ||
        mission.title.toLowerCase().includes(search.toLowerCase()) ||
        mission.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || mission.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignedMissions, search, statusFilter]);

  const totalAssignedTasks = tasks.length;
  const completedAssignedTasks = tasks.filter(
    (t) => String(t.status).toLowerCase() === "completed"
  ).length;
  const overallRate =
    totalAssignedTasks > 0
      ? Math.round((completedAssignedTasks / totalAssignedTasks) * 100)
      : 0;

  return (
    <DashboardLayout>
      {/* HEADER WITH OFFICER SELECTOR */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            Officer Portfolio
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Assigned Missions
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            State-level mission directives linked to your individual deliverable tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Officer Selector Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <UserRound size={14} className="text-[#154B38]" />
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
            onClick={loadData}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/employee/tasks")}
            icon={<ListChecks size={14} />}
          >
            My Task Queue
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard
          featured={true}
          title="Assigned Missions"
          value={assignedMissions.length}
          change={assignedMissions.length > 0 ? "Active directives" : "No active directives"}
        />
        <StatCard
          title="Deliverables"
          value={totalAssignedTasks}
          change="Assigned workload"
          changeType="neutral"
        />
        <StatCard
          title="Verified Completed"
          value={completedAssignedTasks}
          change={`${overallRate}% completed`}
          changeType="positive"
        />
        <StatCard
          title="Execution Rate"
          value={totalAssignedTasks > 0 ? `${overallRate}%` : "0%"}
          change={totalAssignedTasks > 0 ? "Milestones on track" : "No tasks assigned"}
          changeType={totalAssignedTasks > 0 ? "positive" : "neutral"}
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
              placeholder="Search assigned missions..."
              className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400 text-[11px] uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              <option>All</option>
              <option>Active</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* MISSION LIST */}
      <div className="space-y-4">
        {filteredMissions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center card-soft-shadow">
            <Target size={36} className="mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Missions Assigned</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              There are currently no state missions or deliverable tasks assigned to {currentEmployee.name}.
            </p>
          </div>
        ) : (
          filteredMissions.map((m) => (
            <Card key={m.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="sage">{m.status}</Badge>
                    <Badge variant={m.priority === "High" ? "danger" : "default"}>
                      {m.priority} Priority
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">Due {m.deadline}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{m.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.description}</p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/employee/tasks")}
                  icon={<ArrowRight size={14} />}
                >
                  View Tasks
                </Button>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Deliverable Progress</span>
                  <span className="font-extrabold text-slate-900">{m.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#154B38] transition-all"
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{m.team}</span>
                <span>{m.completed} of {m.tasks} tasks completed</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeMissions;