import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Target,
  CalendarDays,
  Building2,
  FileText,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Shield,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";

import {
  createMission,
  createDepartmentAllocation,
} from "../../utils/localStorage";
import { getDepartmentNames } from "../../data/hierarchy";

// Standard SIH25250 Mission Presets
const MISSION_PRESETS = [
  {
    title: "State Scholarship Verification Drive 2025",
    description: "Accelerated state-wide student credential and eligibility verification for national/state scholarship awards.",
    target: "10000",
    deadline: "2025-03-31",
    priority: "High",
    departments: ["Education Department"],
  },
  {
    title: "Public Health Records Digitization Mission",
    description: "Comprehensive medical and health records digitization across district healthcare centers and hospitals.",
    target: "5000",
    deadline: "2025-06-30",
    priority: "High",
    departments: ["Healthcare Department"],
  },
  {
    title: "Inter-Department Civic & Education Empowerment Drive",
    description: "Multi-department initiative combining student civic aid, digital learning tools, and healthcare screening.",
    target: "12000",
    deadline: "2025-09-30",
    priority: "Critical",
    departments: ["Education Department", "Healthcare Department", "Citizen Services Department"],
  },
];

const MissionCreation = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  const [mission, setMission] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    priority: "Medium",
    departments: [],
  });

  // Custom Department Targets Map { [deptName]: number }
  const [deptCustomTargets, setDeptCustomTargets] = useState({});
  const [useCustomDeptSplit, setUseCustomDeptSplit] = useState(false);

  const availableDepartments = useMemo(() => getDepartmentNames(), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMission((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyPreset = (preset) => {
    setMission({
      title: preset.title,
      description: preset.description,
      target: preset.target,
      deadline: preset.deadline,
      priority: preset.priority,
      departments: preset.departments.filter((d) => availableDepartments.includes(d)),
    });
    setUseCustomDeptSplit(false);
  };

  const toggleDepartment = (department) => {
    if (creating) return;

    setMission((prev) => {
      const alreadySelected = prev.departments.includes(department);
      const updated = alreadySelected
        ? prev.departments.filter((item) => item !== department)
        : [...prev.departments, department];
      return {
        ...prev,
        departments: updated,
      };
    });
  };

  // Compute department allocation breakdown
  const deptAllocations = useMemo(() => {
    const totalTarget = Number(mission.target) || 0;
    const depts = mission.departments;
    if (depts.length === 0) return [];

    if (!useCustomDeptSplit) {
      const baseTarget = Math.floor(totalTarget / depts.length);
      const remainder = totalTarget % depts.length;
      return depts.map((dept, index) => ({
        department: dept,
        allocatedTarget: baseTarget + (index < remainder ? 1 : 0),
      }));
    } else {
      return depts.map((dept) => ({
        department: dept,
        allocatedTarget: Number(deptCustomTargets[dept]) || 0,
      }));
    }
  }, [mission.target, mission.departments, useCustomDeptSplit, deptCustomTargets]);

  const customAllocSum = useMemo(() => {
    return deptAllocations.reduce((sum, d) => sum + d.allocatedTarget, 0);
  }, [deptAllocations]);

  const validateStepOne = () => {
    if (!mission.title.trim()) {
      window.alert("Please enter a mission title.");
      return false;
    }
    if (!mission.description.trim()) {
      window.alert("Please enter a mission description.");
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    const totalTarget = Number(mission.target);
    if (!mission.target || isNaN(totalTarget) || totalTarget <= 0) {
      window.alert("Please enter a valid positive numeric mission target.");
      return false;
    }
    if (!mission.deadline) {
      window.alert("Please select a valid deadline date.");
      return false;
    }
    if (mission.departments.length === 0) {
      window.alert("Please select at least one participating department.");
      return false;
    }
    if (useCustomDeptSplit) {
      if (customAllocSum !== totalTarget) {
        window.alert(
          `Sum of department allocations (${customAllocSum.toLocaleString()}) must exactly equal the total mission target (${totalTarget.toLocaleString()}).`
        );
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (creating) return;
    if (step === 1 && !validateStepOne()) return;
    if (step === 2 && !validateStepTwo()) return;
    if (step < 3) setStep((prev) => prev + 1);
  };

  const previousStep = () => {
    if (step > 1 && !creating) {
      setStep((prev) => prev - 1);
    }
  };

  const handleCreateMission = () => {
    if (creating) return;
    if (!validateStepOne()) {
      setStep(1);
      return;
    }
    if (!validateStepTwo()) {
      setStep(2);
      return;
    }

    setCreating(true);

    try {
      const totalTarget = Number(mission.target);

      // Phase 2: Create root Government Mission
      const createdMission = createMission({
        title: mission.title.trim(),
        description: mission.description.trim(),
        target: totalTarget,
        deadline: mission.deadline,
        priority: mission.priority,
        departments: [...mission.departments],
      });

      if (!createdMission) {
        throw new Error("Mission creation failed.");
      }

      // Automatically create department target allocations
      deptAllocations.forEach((alloc) => {
        createDepartmentAllocation({
          missionId: createdMission.id,
          department: alloc.department,
          allocatedTarget: alloc.allocatedTarget,
        });
      });

      window.alert(
        `Mission "${createdMission.title}" created with ${deptAllocations.length} department directive(s) successfully!`
      );
      navigate("/government/missions");
    } catch (error) {
      console.error("Failed to create mission:", error);
      window.alert("Unable to create mission. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/government/missions")}
            className="flex items-center gap-1.5 text-xs font-bold text-[#154B38] hover:underline mb-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Missions</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Create Government Mission
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Phase 2 • Define high-level state outcomes and cascade targets across responsible departments.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* STEP PROGRESS BAR */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Objective & Details", icon: FileText },
              { num: 2, label: "Targets & Departments", icon: Building2 },
              { num: 3, label: "Review & Cascade", icon: Target },
            ].map((s, index) => {
              const isCompleted = step > s.num;
              const isCurrent = step === s.num;
              const Icon = s.icon;

              return (
                <React.Fragment key={s.num}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-all shadow-xs
                        ${
                          isCompleted
                            ? "bg-[#154B38] text-white"
                            : isCurrent
                            ? "border-2 border-[#154B38] bg-white text-[#154B38] ring-4 ring-[#154B38]/10"
                            : "border border-slate-200 bg-white text-slate-400"
                        }
                      `}
                    >
                      {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Step {s.num}
                      </p>
                      <p
                        className={`text-xs font-bold ${
                          isCurrent ? "text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  </div>

                  {index < 2 && (
                    <div
                      className={`
                        h-0.5 flex-1 mx-4 transition-all
                        ${step > index + 1 ? "bg-[#154B38]" : "bg-slate-200"}
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* STEP 1: OBJECTIVE & DETAILS */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Quick Presets Banner */}
            <Card className="p-5 border-l-4 border-l-[#154B38] bg-emerald-50/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#154B38]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#154B38]">
                  Quick Standard Mission Presets (SIH25250 Standard)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {MISSION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-left p-3 rounded-xl border border-emerald-200/80 bg-white hover:border-[#154B38] hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#154B38] line-clamp-1">
                      {preset.title}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                      {preset.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-600">
                      <span>Target: {Number(preset.target).toLocaleString()}</span>
                      <span className="text-[#154B38] font-bold">Use Preset →</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Step 1: Mission Objectives & Details
              </h2>
              <p className="text-xs text-slate-400 font-medium mb-6">
                Establish the root strategic mission for government performance alignment.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mission Title <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="title"
                    value={mission.title}
                    onChange={handleChange}
                    placeholder="e.g. State Scholarship Verification Drive 2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description & Mandate <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={mission.description}
                    onChange={handleChange}
                    placeholder="Describe the operational goals, target audience, and expected delivery standard..."
                    className="w-full rounded-xl border border-slate-200/90 bg-white p-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#154B38] focus:outline-none focus:ring-4 focus:ring-[#154B38]/10 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Priority Level
                    </label>
                    <select
                      name="priority"
                      value={mission.priority}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-xs font-bold text-slate-800 focus:border-[#154B38] focus:outline-none"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Critical">Critical Priority</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button variant="primary" onClick={nextStep} icon={<ArrowRight size={16} />}>
                  Continue to Targets & Departments
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: TARGETS & DEPARTMENTS */}
        {step === 2 && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Step 2: Targets & Department Allocation
            </h2>
            <p className="text-xs text-slate-400 font-medium mb-6">
              Set total deliverable volume and select responsible state departments.
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Overall Target Volume <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="target"
                    type="number"
                    min="1"
                    value={mission.target}
                    onChange={handleChange}
                    placeholder="e.g. 10000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mandated Deadline <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="deadline"
                    type="date"
                    value={mission.deadline}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Participating Departments <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableDepartments.map((dept) => {
                    const isSelected = mission.departments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => toggleDepartment(dept)}
                        className={`
                          flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer
                          ${
                            isSelected
                              ? "border-[#154B38] bg-[#EBF6F0] text-[#154B38] shadow-2xs font-bold"
                              : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <Building2 size={16} className={isSelected ? "text-[#154B38]" : "text-slate-400"} />
                          <span className="text-xs">{dept}</span>
                        </div>
                        {isSelected && <Check size={16} className="text-[#154B38] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Split Toggle */}
              {mission.departments.length > 1 && (
                <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Department Quota Split
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Split target evenly or configure specific volume quotas per department.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#154B38] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomDeptSplit}
                        onChange={(e) => setUseCustomDeptSplit(e.target.checked)}
                        className="rounded accent-[#154B38] cursor-pointer"
                      />
                      Custom Split
                    </label>
                  </div>

                  {useCustomDeptSplit && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200">
                      {mission.departments.map((dept) => (
                        <div key={dept} className="flex items-center justify-between gap-4">
                          <span className="text-xs font-semibold text-slate-700">{dept}</span>
                          <input
                            type="number"
                            min="1"
                            value={deptCustomTargets[dept] || ""}
                            onChange={(e) =>
                              setDeptCustomTargets({
                                ...deptCustomTargets,
                                [dept]: e.target.value,
                              })
                            }
                            placeholder="Target units"
                            className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 text-right focus:border-[#154B38] focus:outline-none"
                          />
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-200 text-slate-800">
                        <span>Total Allocated / Mission Target:</span>
                        <span
                          className={
                            customAllocSum === Number(mission.target)
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }
                        >
                          {customAllocSum.toLocaleString()} / {Number(mission.target || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="secondary" onClick={previousStep} icon={<ArrowLeft size={16} />}>
                Back
              </Button>

              <Button variant="primary" onClick={nextStep} icon={<ArrowRight size={16} />}>
                Review Directive
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: REVIEW & CONFIRM */}
        {step === 3 && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Step 3: Review & Publish Government Directive
            </h2>
            <p className="text-xs text-slate-400 font-medium mb-6">
              Confirm mission parameters before publishing and generating department directives.
            </p>

            <div className="rounded-2xl bg-[#F4F6F8] p-5 border border-slate-200/80 space-y-4 mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Directive Title
                </span>
                <p className="text-base font-bold text-slate-900">{mission.title}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mandate & Description
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">{mission.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total State Target
                  </span>
                  <p className="text-sm font-extrabold text-slate-900">
                    {Number(mission.target).toLocaleString()} units
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Priority
                  </span>
                  <div>
                    <Badge variant={mission.priority === "High" || mission.priority === "Critical" ? "danger" : "warning"}>
                      {mission.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Target Deadline
                  </span>
                  <p className="text-xs font-bold text-slate-800">{mission.deadline}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Cascaded Department Allocations ({deptAllocations.length})
                </span>
                <div className="space-y-2">
                  {deptAllocations.map((alloc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200/90 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-[#154B38]" />
                        <span className="text-xs font-bold text-slate-800">
                          {alloc.department}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#154B38]">
                        {alloc.allocatedTarget.toLocaleString()} units
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={previousStep}
                disabled={creating}
                icon={<ArrowLeft size={16} />}
              >
                Back
              </Button>

              <Button
                variant="primary"
                onClick={handleCreateMission}
                loading={creating}
                icon={<Check size={16} />}
              >
                Publish & Cascade Directive
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MissionCreation;