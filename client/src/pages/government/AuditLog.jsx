import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  History,
  Shield,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

import { getTasks, getMissions } from "../../utils/localStorage";

const AuditLog = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [missions, setMissions] = useState([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    try {
      setTasks(getTasks() || []);
      setMissions(getMissions() || []);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Aggregate all timestamped status logs from all tasks
  const auditEntries = useMemo(() => {
    const list = [];
    tasks.forEach((t) => {
      if (Array.isArray(t.statusLog) && t.statusLog.length > 0) {
        t.statusLog.forEach((log, idx) => {
          list.push({
            id: `${t.id}_log_${idx}`,
            taskId: t.id,
            taskTitle: t.title || t.name,
            officer: t.employeeName || t.employee || "Assigned Officer",
            team: t.team || "General Team",
            department: t.department || "Education Department",
            fromStatus: log.from || log.fromStatus || "Created",
            toStatus: log.to || log.toStatus || log.status || "In Progress",
            changedBy: log.changedBy || log.by || t.employeeName || "System Event",
            note: log.note || log.reason || log.evidenceNotes || "Status transition recorded",
            timestamp: log.timestamp || log.date || t.updatedAt || t.createdAt || new Date().toISOString(),
          });
        });
      } else {
        // Fallback single entry from task state
        list.push({
          id: `${t.id}_default`,
          taskId: t.id,
          taskTitle: t.title || t.name,
          officer: t.employeeName || t.employee || "Assigned Officer",
          team: t.team || "General Team",
          department: t.department || "Education Department",
          fromStatus: "Created",
          toStatus: t.status || "In Progress",
          changedBy: t.verifiedBy || t.employeeName || "System Initializer",
          note: t.evidenceNotes || t.rejectionReason || "Task lifecycle initialized",
          timestamp: t.updatedAt || t.createdAt || new Date().toISOString(),
        });
      }
    });

    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [tasks]);

  const filteredEntries = useMemo(() => {
    return auditEntries.filter((entry) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        entry.taskTitle.toLowerCase().includes(q) ||
        entry.officer.toLowerCase().includes(q) ||
        entry.team.toLowerCase().includes(q) ||
        entry.changedBy.toLowerCase().includes(q);

      const matchesAction =
        actionFilter === "All" ||
        entry.toStatus.toLowerCase() === actionFilter.toLowerCase();

      return matchesSearch && matchesAction;
    });
  }, [auditEntries, search, actionFilter]);

  const exportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredEntries, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute(
      "download",
      `GovernScale_Audit_Trail_${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const formatTime = (ts) => {
    if (!ts) return "N/A";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <Shield size={14} />
            <span>State Compliance & Accountability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Centralized Activity Audit Trail
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Chronological, immutable audit logs of all deliverable lifecycle transitions, supervisor approvals, and quota redistributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportJSON}
            icon={<Download size={14} />}
          >
            Export JSON
          </Button>

          <button
            type="button"
            onClick={loadData}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 shadow-2xs cursor-pointer"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          featured={true}
          title="Total Audit Events"
          value={auditEntries.length}
          change="Logged lifecycle transitions"
        />

        <StatCard
          title="Verified Approvals"
          value={
            auditEntries.filter(
              (e) => e.toStatus.toLowerCase() === "completed"
            ).length
          }
          change="Supervisor desk sign-offs"
          changeType="positive"
        />

        <StatCard
          title="Submissions Pending"
          value={
            auditEntries.filter((e) =>
              ["submitted", "pending verification"].includes(
                e.toStatus.toLowerCase()
              )
            ).length
          }
          change="Awaiting supervisor review"
          changeType="neutral"
        />

        <StatCard
          title="Active Officers"
          value={new Set(auditEntries.map((e) => e.officer)).size}
          change="Contributing staff members"
        />
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by task, officer, team or actor..."
              className="w-full rounded-full border border-slate-200/90 bg-[#F4F6F8] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-bold uppercase">
              Action:
            </span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="All">All Actions</option>
              <option value="Completed">Completed / Verified</option>
              <option value="Submitted">Submitted for Verification</option>
              <option value="In Progress">In Progress</option>
              <option value="Rejected">Rejected / Rework</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="p-6">
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <History size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No audit events match your filter</p>
            <p className="mt-0.5">Task lifecycle transitions will be automatically logged here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Timestamp</th>
                  <th className="pb-3 px-4">Task Deliverable</th>
                  <th className="pb-3 px-4">Officer</th>
                  <th className="pb-3 px-4">Transition</th>
                  <th className="pb-3 px-4">Authorized By</th>
                  <th className="pb-3 pl-4">Evidence / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pr-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatTime(entry.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[220px] truncate">
                      {entry.taskTitle}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {entry.officer}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {entry.team}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">{entry.fromStatus}</span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <Badge
                          variant={
                            entry.toStatus.toLowerCase() === "completed"
                              ? "completed"
                              : entry.toStatus.toLowerCase() === "rejected"
                              ? "danger"
                              : ["submitted", "pending verification"].includes(
                                  entry.toStatus.toLowerCase()
                                )
                              ? "warning"
                              : "default"
                          }
                        >
                          {entry.toStatus}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {entry.changedBy}
                    </td>
                    <td className="py-3.5 pl-4 text-slate-500 max-w-[240px] truncate text-[11px]">
                      {entry.note}
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

export default AuditLog;
