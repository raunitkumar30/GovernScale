// =====================================================
// GOVERNSCALE - MATHEMATICAL SCORING & AGGREGATION ENGINE
// =====================================================
// Full implementation of the E-Office Productivity Alignment Module (SIH25250)
//
// 1. Four Sub-Scores:
//    - Volume (25%): Ratio of completed verified deliverables vs assigned
//    - Timeliness (30%): Completion within defined deadlines without delay
//    - Quality (30%): Verified evidence compliance (notes, deliverable URLs, proofs)
//    - Complexity (15%): Weighted task difficulty (High=100, Medium=70, Low=40)
//
// 2. Bottom-Up Performance Hierarchy:
//    Task Data → Employee Performance → Team Efficiency →
//    Organization Efficiency → Department Efficiency → Government Intelligence
//
// 3. Decision-Support Engine:
//    Task Category → Pull historical tasks → Filter relevant teams →
//    Calculate recent performance → Rank teams → Return recommendation
// =====================================================

export const DEFAULT_ROLE_WEIGHTS = {
  default: { volume: 0.25, timeliness: 0.30, quality: 0.30, complexity: 0.15 },
  operations: { volume: 0.35, timeliness: 0.30, quality: 0.20, complexity: 0.15 },
  technical: { volume: 0.15, timeliness: 0.25, quality: 0.40, complexity: 0.20 },
  verification: { volume: 0.15, timeliness: 0.30, quality: 0.40, complexity: 0.15 },
  supervisor: { volume: 0.20, timeliness: 0.30, quality: 0.30, complexity: 0.20 },
};

export const ROLE_WEIGHTS = DEFAULT_ROLE_WEIGHTS.default;

export function getRoleWeights(roleName = "") {
  try {
    const stored = localStorage.getItem("governscale_role_weights");
    const custom = stored ? JSON.parse(stored) : {};
    const r = (roleName || "").toLowerCase();
    if (r.includes("tech") || r.includes("engineer") || r.includes("developer")) {
      return custom.technical || DEFAULT_ROLE_WEIGHTS.technical;
    }
    if (r.includes("verif") || r.includes("audit") || r.includes("inspect")) {
      return custom.verification || DEFAULT_ROLE_WEIGHTS.verification;
    }
    if (r.includes("superv") || r.includes("lead") || r.includes("manager")) {
      return custom.supervisor || DEFAULT_ROLE_WEIGHTS.supervisor;
    }
    if (r.includes("operat") || r.includes("field") || r.includes("clerk")) {
      return custom.operations || DEFAULT_ROLE_WEIGHTS.operations;
    }
    return custom.default || DEFAULT_ROLE_WEIGHTS.default;
  } catch {
    return DEFAULT_ROLE_WEIGHTS.default;
  }
}

const norm = (s) => String(s ?? "").trim().toLowerCase();

export const isTaskVerified = (t) =>
  !!t &&
  (t.teamVerified === true ||
    t.verifiedByTeam === true ||
    t.teamVerification === true ||
    t.verified === true ||
    ["verified", "approved"].includes(norm(t.verificationStatus)) ||
    ["verified", "approved"].includes(norm(t.reviewStatus)));

export const isTaskCompleted = (t) =>
  !!t && (["completed", "verified"].includes(norm(t.status)) || isTaskVerified(t));

export const isTaskSubmitted = (t) =>
  [
    "submitted",
    "pending verification",
    "awaiting verification",
    "under review",
  ].includes(norm(t?.status));

export const isTaskOverdue = (t) => {
  const d = t?.dueDate || t?.deadline;
  if (!d || isTaskCompleted(t)) return false;
  const x = new Date(d);
  return !Number.isNaN(x.getTime()) && x < new Date();
};

export const clamp = (v, a = 0, b = 100) =>
  Math.min(b, Math.max(a, Number(v) || 0));

// =====================================================
// 1. FOUR SUB-SCORE CALCULATIONS (PURE MATH - NO AI/ML)
// =====================================================

export function calculateVolume(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;
  const completedCount = tasks.filter(isTaskCompleted).length;
  return Math.round((completedCount / tasks.length) * 100);
}

// Calculate total milliseconds a task was on hold for external department
export function calculateExternalDelayMs(task) {
  if (!task || !Array.isArray(task.statusLog)) return 0;
  let totalDelay = 0;
  const log = task.statusLog;
  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    const isWaiting =
      String(entry.to || "").toLowerCase().includes("waiting") ||
      String(entry.to || "").toLowerCase().includes("external");
    if (isWaiting) {
      const startTime = new Date(entry.timestamp).getTime();
      const nextEntry = log[i + 1];
      const endTime = nextEntry ? new Date(nextEntry.timestamp).getTime() : Date.now();
      if (!isNaN(startTime) && !isNaN(endTime) && endTime > startTime) {
        totalDelay += endTime - startTime;
      }
    }
  }
  return totalDelay;
}

export function calculateTimeliness(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;
  const withDeadline = tasks.filter((t) => t?.dueDate || t?.deadline);
  if (!withDeadline.length) return 0;

  let totalScore = 0;
  withDeadline.forEach((t) => {
    const due = new Date(t.dueDate || t.deadline);
    const externalDelayMs = calculateExternalDelayMs(t);
    const effectiveDue = !isNaN(due.getTime()) ? new Date(due.getTime() + externalDelayMs) : due;

    if (!isTaskCompleted(t)) {
      const isOverdueNow = effectiveDue && !isNaN(effectiveDue.getTime()) && effectiveDue < new Date();
      totalScore += isOverdueNow ? 0 : 70;
      return;
    }
    const completedAt = t.completedAt || t.completionDate ? new Date(t.completedAt || t.completionDate) : null;

    if (!completedAt || isNaN(completedAt.getTime()) || isNaN(effectiveDue.getTime())) {
      totalScore += 80;
      return;
    }

    if (completedAt <= effectiveDue) {
      totalScore += 100;
    } else {
      const daysLate = Math.ceil((completedAt - effectiveDue) / (1000 * 60 * 60 * 24));
      totalScore += Math.max(0, 100 - daysLate * 10);
    }
  });

  return Math.round(totalScore / withDeadline.length);
}

// Phase 5 Quality Score: First-pass approval rate vs rework vs rejection
export function calculateQuality(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(isTaskCompleted);
  if (!completedTasks.length) return 0;

  let totalQuality = 0;
  completedTasks.forEach((t) => {
    // Check if task experienced rejection / rework in statusLog
    const hadRework = Array.isArray(t.statusLog) && t.statusLog.some(
      (e) => String(e.to || "").toLowerCase() === "rejected" || String(e.from || "").toLowerCase() === "rejected"
    );
    const hasEvidence = !!(t.evidenceUrl || t.evidenceNotes || t.deliverableUrl || t.proof);

    if (hadRework) {
      totalQuality += 70; // Approved after rework
    } else if (hasEvidence) {
      totalQuality += 100; // First-pass verified approval
    } else {
      totalQuality += 85;
    }
  });

  return Math.round(totalQuality / completedTasks.length);
}

export function calculateComplexity(tasks, missions = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;
  const missionPriorityMap = new Map(
    (missions || []).map((m) => [String(m.id), norm(m.priority)])
  );

  let total = 0;
  tasks.forEach((t) => {
    const comp = norm(t.complexity);
    const p = comp || norm(t.priority) || missionPriorityMap.get(String(t.missionId || "")) || "medium";
    total += p === "high" || p === "critical" ? 100 : p === "medium" ? 70 : 40;
  });

  return Math.round(total / tasks.length);
}

// Phase 5 Confidence Rating based on completed task sample size
export function calculateConfidence(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;
  const completed = tasks.filter(isTaskCompleted).length;
  if (completed >= 10) return 95;
  if (completed >= 6) return 85;
  if (completed >= 3) return 70;
  if (completed >= 1) return 50;
  return 30;
}

// Phase 5 Pure Mathematical Anomaly Detection Rules
export function detectAnomalies(v, t, q, x, tasks = []) {
  const flags = [];

  // Anomaly 1: Spike in volume but drop in quality
  if (v >= 80 && q <= 60 && tasks.length >= 3) {
    flags.push({
      type: "warning",
      tag: "Possible Rushed Work",
      detail: `High volume (${v}%) accompanied by low verification quality (${q}%). Deliverables may require closer supervisor audit.`,
    });
  }

  // Anomaly 2: Consistently high quality but low volume
  if (q >= 90 && v <= 40 && tasks.length >= 3) {
    flags.push({
      type: "info",
      tag: "Low Output, High Accuracy",
      detail: `Outstanding deliverable quality (${q}%) but low completion volume (${v}%). May benefit from task redistribution.`,
    });
  }

  // Anomaly 3: High external delay impact
  const totalExternalMs = tasks.reduce((sum, task) => sum + calculateExternalDelayMs(task), 0);
  const totalExternalDays = Math.round(totalExternalMs / (1000 * 60 * 60 * 24));
  if (totalExternalDays >= 3) {
    flags.push({
      type: "neutral",
      tag: "Heavy External Dependency",
      detail: `${totalExternalDays} days on external department hold. Fair SLA protection applied.`,
    });
  }

  // Anomaly 4: Exemplary Performance
  if (v >= 85 && t >= 85 && q >= 85 && tasks.length >= 2) {
    flags.push({
      type: "positive",
      tag: "Exemplary Performance",
      detail: `Exceeding performance benchmark across all four pillars (${v}% Vol, ${t}% Time, ${q}% Qual).`,
    });
  }

  return flags;
}

export function calculateScore(tasks, missions = [], customWeights = null, roleName = "") {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      score: 0,
      volume: 0,
      timeliness: 0,
      quality: 0,
      complexity: 0,
      confidence: 0,
      anomalies: 0,
      anomalyFlags: [],
      weightsUsed: customWeights || getRoleWeights(roleName),
    };
  }

  const v = calculateVolume(tasks);
  const t = calculateTimeliness(tasks);
  const q = calculateQuality(tasks);
  const x = calculateComplexity(tasks, missions);

  const w = customWeights || getRoleWeights(roleName);
  const final = Math.round(
    v * (w.volume ?? 0.25) +
    t * (w.timeliness ?? 0.30) +
    q * (w.quality ?? 0.30) +
    x * (w.complexity ?? 0.15)
  );

  const confidence = calculateConfidence(tasks);
  const anomalyFlags = detectAnomalies(v, t, q, x, tasks);

  return {
    score: clamp(final),
    volume: v,
    timeliness: t,
    quality: q,
    complexity: x,
    confidence,
    anomalies: anomalyFlags.length,
    anomalyFlags,
    weightsUsed: w,
  };
}

// =====================================================
// 2. BOTTOM-UP PERFORMANCE HIERARCHY AGGREGATION
// =====================================================

// Level 1: Employee Performance Roll-up
export function aggregateEmployeeScores(tasks) {
  const employeeMap = {};

  (tasks || []).forEach((task) => {
    const officer = task.employeeName || task.assignedTo || "Unassigned";
    if (!employeeMap[officer]) {
      employeeMap[officer] = {
        name: officer,
        department: task.department || "General",
        organization: task.organization || "General",
        team: task.team || task.teamName || "General",
        tasks: [],
      };
    }
    employeeMap[officer].tasks.push(task);
  });

  return Object.values(employeeMap).map((emp) => {
    const sc = calculateScore(emp.tasks);
    return {
      ...emp,
      ...sc,
      totalTasks: emp.tasks.length,
      completedTasks: emp.tasks.filter(isTaskCompleted).length,
      pendingTasks: emp.tasks.filter((t) => !isTaskCompleted(t)).length,
    };
  }).sort((a, b) => b.score - a.score);
}

// Level 2: Team Efficiency Roll-up (Weighted by Workload & Complexity)
export function aggregateTeamScores(tasks, baseTeams = []) {
  const teamMap = {};

  // Initialize with base registered teams
  baseTeams.forEach((t) => {
    teamMap[t.name] = {
      name: t.name,
      organization: t.organization || "Agency",
      department: t.department || "Department",
      lead: t.lead || "Team Supervisor",
      baseOfficers: t.baseOfficers || 6,
      tasks: [],
    };
  });

  (tasks || []).forEach((task) => {
    const teamName = task.team || task.teamName || "General Operations";
    if (!teamMap[teamName]) {
      teamMap[teamName] = {
        name: teamName,
        organization: task.organization || "Agency",
        department: task.department || "Department",
        lead: "Team Supervisor",
        baseOfficers: 6,
        tasks: [],
      };
    }
    teamMap[teamName].tasks.push(task);
  });

  return Object.values(teamMap).map((team) => {
    // 1. Group tasks by employee within this team
    const empTaskMap = {};
    team.tasks.forEach((t) => {
      const emp = t.employeeName || t.assignedTo || "General Officer";
      if (!empTaskMap[emp]) {
        empTaskMap[emp] = {
          name: emp,
          id: t.employeeId || emp,
          tasks: [],
        };
      }
      empTaskMap[emp].tasks.push(t);
    });

    const memberBreakdown = Object.values(empTaskMap).map((member) => {
      const memberScore = calculateScore(member.tasks);
      const completed = member.tasks.filter(isTaskCompleted).length;
      const overdue = member.tasks.filter(isTaskOverdue).length;
      const pending = member.tasks.filter((t) => !isTaskCompleted(t)).length;
      return {
        ...member,
        ...memberScore,
        completedCount: completed,
        overdueCount: overdue,
        pendingCount: pending,
      };
    });

    // 2. Volume-Weighted Team Score (Spec Phase 6 Formula):
    // Team Score = sum(Employee Score * Completed Tasks) / Total Completed Tasks
    const totalTeamCompleted = memberBreakdown.reduce((sum, m) => sum + m.completedCount, 0);
    let weightedScore = 0;

    if (totalTeamCompleted > 0) {
      const weightedSum = memberBreakdown.reduce(
        (sum, m) => sum + m.score * m.completedCount,
        0
      );
      weightedScore = Math.round(weightedSum / totalTeamCompleted);
    } else {
      // Fallback if no tasks completed yet
      const baseSc = calculateScore(team.tasks);
      weightedScore = baseSc.score;
    }

    const baseTeamScore = calculateScore(team.tasks);
    const activeStaff = memberBreakdown.length;

    // 3. Automated Bottleneck & Redistribution Recommendations (Spec Phase 6)
    const behindMembers = memberBreakdown.filter((m) => m.overdueCount > 0 || (m.pendingCount >= 5 && m.score < 75));
    const highCapacityMembers = memberBreakdown.filter((m) => m.score >= 85 && m.pendingCount <= 3);

    let bottleneckAlert = null;
    let redistributionRecommendation = null;

    if (behindMembers.length > 0) {
      const names = behindMembers.map((m) => m.name).join(" and ");
      const totalOverdue = behindMembers.reduce((sum, m) => sum + m.overdueCount, 0);
      bottleneckAlert = `${names} ${behindMembers.length > 1 ? "are" : "is"} behind on deliverables — ${totalOverdue} overdue / high pending tasks.`;

      if (highCapacityMembers.length > 0) {
        const donor = behindMembers[0];
        const recipient = highCapacityMembers[0];
        const transferUnits = Math.min(50, donor.pendingCount > 0 ? donor.pendingCount * 5 : 20);
        redistributionRecommendation = `Redistribute ~${transferUnits} units from ${donor.name} to ${recipient.name} (has capacity & ${recipient.score} efficiency).`;
      }
    }

    return {
      ...team,
      ...baseTeamScore,
      score: clamp(weightedScore),
      weightedEfficiency: clamp(weightedScore),
      memberBreakdown,
      bottleneckAlert,
      redistributionRecommendation,
      totalTasks: team.tasks.length,
      completedTasks: team.tasks.filter(isTaskCompleted).length,
      submittedTasks: team.tasks.filter(isTaskSubmitted).length,
      overdueTasks: team.tasks.filter(isTaskOverdue).length,
      activeStaff: activeStaff || (team.tasks.length > 0 ? 1 : 0),
      availableOfficers: Math.max(1, team.baseOfficers - activeStaff),
    };
  }).sort((a, b) => b.score - a.score);
}

// Level 3: Organization Efficiency Roll-up (Phase 7: Weighted by Team Task Volume)
export function aggregateOrganizationScores(tasks, baseOrganizations = [], baseTeams = []) {
  const orgMap = {};

  // Initialize with base registered organizations
  baseOrganizations.forEach((o) => {
    orgMap[o.name] = {
      name: o.name,
      department: o.department || "General Department",
      head: o.head || "Agency Director",
      tasks: [],
      teams: new Set(),
    };
  });

  (tasks || []).forEach((task) => {
    const org = task.organization || "Administrative Services";
    if (!orgMap[org]) {
      orgMap[org] = {
        name: org,
        department: task.department || "General Department",
        head: "Agency Director",
        tasks: [],
        teams: new Set(),
      };
    }
    orgMap[org].tasks.push(task);
    if (task.team || task.teamName) {
      orgMap[org].teams.add(task.team || task.teamName);
    }
  });

  return Object.values(orgMap).map((org) => {
    // 1. Roll up each team within this organization using aggregateTeamScores
    const orgTeams = aggregateTeamScores(org.tasks, baseTeams.filter((t) => t.organization === org.name));

    // 2. Volume-Weighted Organization Score (Spec Phase 7 Formula):
    // Org Score = sum(Team Score * Team Tasks Completed) / Total Tasks in Org
    const totalOrgCompleted = orgTeams.reduce((sum, t) => sum + (t.completedTasks || 0), 0);
    let weightedOrgScore = 0;

    if (totalOrgCompleted > 0) {
      const weightedSum = orgTeams.reduce(
        (sum, t) => sum + t.score * (t.completedTasks || 0),
        0
      );
      weightedOrgScore = Math.round(weightedSum / totalOrgCompleted);
    } else {
      const baseSc = calculateScore(org.tasks);
      weightedOrgScore = baseSc.score;
    }

    const baseOrgScore = calculateScore(org.tasks);

    // 3. Ranked Team Leaderboard (1st, 2nd, 3rd)
    const rankedTeams = [...orgTeams].sort((a, b) => b.score - a.score).map((t, idx) => ({
      ...t,
      rank: idx + 1,
      rankLabel: idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : `${idx + 1}th`,
    }));

    // 4. Inter-Team Bottleneck Alert (Spec Phase 7)
    let interTeamBottleneck = null;
    if (rankedTeams.length > 1) {
      const slowestTeam = rankedTeams[rankedTeams.length - 1];
      const fastestTeam = rankedTeams[0];
      if (fastestTeam.score - slowestTeam.score >= 10 || slowestTeam.overdueTasks > 0) {
        interTeamBottleneck = `${slowestTeam.name} (${slowestTeam.score} index) is the slowest operational link — creating latency across ${org.name}.`;
      }
    }

    return {
      ...org,
      ...baseOrgScore,
      score: clamp(weightedOrgScore),
      weightedEfficiency: clamp(weightedOrgScore),
      teams: Array.from(org.teams),
      teamsCount: orgTeams.length || org.teams.size || 1,
      teamLeaderboard: rankedTeams,
      interTeamBottleneck,
      totalTasks: org.tasks.length,
      completedTasks: org.tasks.filter(isTaskCompleted).length,
      submittedTasks: org.tasks.filter(isTaskSubmitted).length,
      overdueTasks: org.tasks.filter(isTaskOverdue).length,
    };
  }).sort((a, b) => b.score - a.score);
}

// Level 4: Department Efficiency Roll-up (Phase 8: Weighted by Organization Task Volume)
export function aggregateDepartmentScores(tasks, missions = [], baseDepartments = [], baseOrganizations = []) {
  const deptMap = {};

  // Initialize with base registered departments
  baseDepartments.forEach((d) => {
    deptMap[d.name] = {
      name: d.name,
      code: d.code || "DEPT",
      minister: d.minister || "Cabinet Minister",
      tasks: [],
      organizations: new Set(),
    };
  });

  const resolveDept = (task) => {
    const d = String(task.department || "").trim();
    if (d && d.toLowerCase().includes("department")) return d;
    const org = String(task.organization || "").toLowerCase().trim();

    try {
      const rawOrgs = localStorage.getItem("governscale_organizations");
      if (rawOrgs) {
        const parsed = JSON.parse(rawOrgs);
        if (Array.isArray(parsed)) {
          const match = parsed.find((o) => (o.name || "").toLowerCase().trim() === org);
          if (match && match.department) return match.department;
        }
      }
    } catch { /* fallback below */ }

    if (["scholarship services", "citizen education services", "digital education", "document services", "student support services"].includes(org)) {
      return "Education Department";
    }
    if (["health services", "health data services", "public health bureau", "medical supplies division"].includes(org)) {
      return "Healthcare Department";
    }
    if (["citizen support services"].includes(org)) {
      return "Citizen Services Department";
    }
    return d || "Education Department";
  };

  (tasks || []).forEach((task) => {
    const dept = resolveDept(task);
    if (!deptMap[dept]) {
      deptMap[dept] = {
        name: dept,
        code: "DEPT",
        minister: "Cabinet Minister",
        tasks: [],
        organizations: new Set(),
      };
    }
    deptMap[dept].tasks.push(task);
    if (task.organization) {
      deptMap[dept].organizations.add(task.organization);
    }
  });

  return Object.values(deptMap).map((dept) => {
    // 1. Roll up each organization within this department
    const deptOrgs = aggregateOrganizationScores(
      dept.tasks,
      baseOrganizations.filter((o) => o.department === dept.name)
    );

    // 2. Volume-Weighted Department Score (Spec Phase 8 Formula):
    // Dept Score = sum(Org Score * Org Tasks Completed) / Total Tasks in Dept
    const totalDeptCompleted = deptOrgs.reduce((sum, o) => sum + (o.completedTasks || 0), 0);
    let weightedDeptScore = 0;

    if (totalDeptCompleted > 0) {
      const weightedSum = deptOrgs.reduce(
        (sum, o) => sum + o.score * (o.completedTasks || 0),
        0
      );
      weightedDeptScore = Math.round(weightedSum / totalDeptCompleted);
    } else {
      const baseSc = calculateScore(dept.tasks, missions);
      weightedDeptScore = baseSc.score;
    }

    const baseDeptScore = calculateScore(dept.tasks, missions);

    // 3. Organization Volume Share Breakdown (Spec Phase 8)
    const orgBreakdown = deptOrgs.map((org) => {
      const orgComp = org.completedTasks || 0;
      const share = totalDeptCompleted > 0 ? Math.round((orgComp / totalDeptCompleted) * 100) : 0;
      return {
        ...org,
        volumeShare: share,
        completedVolume: orgComp,
      };
    }).sort((a, b) => b.score - a.score);

    // 4. Mission Contribution Calculation
    const deptMissions = missions.filter((m) =>
      Array.isArray(m.departments) && m.departments.some((d) => d.toLowerCase() === dept.name.toLowerCase())
    );
    const totalMissionTarget = deptMissions.reduce((sum, m) => sum + Number(m.target || 0), 0);
    const missionContributionRate = totalMissionTarget > 0
      ? Math.min(100, Math.round((totalDeptCompleted / totalMissionTarget) * 100))
      : 0;

    return {
      ...dept,
      ...baseDeptScore,
      score: clamp(weightedDeptScore),
      weightedEfficiency: clamp(weightedDeptScore),
      organizations: Array.from(dept.organizations),
      organizationsCount: deptOrgs.length || dept.organizations.size || 1,
      organizationBreakdown: orgBreakdown,
      missionContributionRate,
      totalMissionTarget,
      totalTasks: dept.tasks.length,
      completedTasks: dept.tasks.filter(isTaskCompleted).length,
      submittedTasks: dept.tasks.filter(isTaskSubmitted).length,
      overdueTasks: dept.tasks.filter(isTaskOverdue).length,
    };
  }).sort((a, b) => b.score - a.score);
}

// =====================================================
// 3. DECISION-SUPPORT ENGINE (SECTION 5 OF SPEC)
// =====================================================
// Task Category → Pull historical tasks of this type → Filter relevant teams →
// Calculate their recent performance → Rank teams → Return recommendation

export function evaluateDecisionSupport(tasks = [], category = "all", baseTeams = []) {
  const normCat = norm(category);

  return baseTeams.map((team) => {
    // 1. Pull historical tasks relevant to this team
    const teamTasks = tasks.filter(
      (t) => (t.team === team.name || t.teamName === team.name || t.assignedTo === team.lead)
    );

    // 2. Filter tasks matching category keywords if specified
    const matchingTasks = normCat === "all" || !normCat
      ? teamTasks
      : teamTasks.filter((t) => {
        const text = `${t.title} ${t.description} ${t.department} ${t.organization}`.toLowerCase();
        return text.includes(normCat) || norm(team.department).includes(normCat);
      });

    const completedTasks = matchingTasks.filter(isTaskCompleted);
    const completedWithEvidence = completedTasks.filter((t) => t.evidenceUrl || t.evidenceNotes || t.proof);
    const overdueTasks = matchingTasks.filter(isTaskOverdue);

    // 3. Calculate mathematical indicators
    const similarCount = completedTasks.length;
    const onTimeRate = completedTasks.length > 0
      ? Math.max(0, Math.round(((completedTasks.length - matchingTasks.filter((t) => isTaskCompleted(t) && isTaskOverdue(t)).length) / completedTasks.length) * 100))
      : tasks.length === 0 ? 0 : 0;

    const qualityRate = completedTasks.length > 0
      ? Math.round((completedWithEvidence.length / completedTasks.length) * 100)
      : tasks.length === 0 ? 0 : 0;

    const activeStaff = new Set(
      teamTasks.map((t) => t.employeeName || t.assignedTo).filter(Boolean)
    ).size;
    const availableOfficers = Math.max(1, team.baseOfficers - activeStaff);

    // Workload calculation
    const pendingCount = teamTasks.filter((t) => !isTaskCompleted(t)).length;
    const workload = tasks.length === 0
      ? 0
      : Math.min(100, Math.round((pendingCount / Math.max(1, team.baseOfficers * 2)) * 100));

    // 4. Overall Decision Fit Score
    let score = 0;
    if (similarCount > 0) {
      score = Math.round(
        onTimeRate * 0.40 +
        qualityRate * 0.35 +
        Math.max(0, 100 - workload) * 0.25
      );
    } else if (tasks.length > 0 && teamTasks.length > 0) {
      // General team score fallback if no similar category tasks
      const baseSc = calculateScore(teamTasks);
      score = Math.round(baseSc.score * 0.7 + Math.max(0, 100 - workload) * 0.3);
    } else {
      // Clean zero state when no tasks exist
      score = 0;
    }

    return {
      id: team.id,
      name: team.name,
      department: team.department,
      organization: team.organization,
      lead: team.lead,
      similarTasksHandled: similarCount,
      onTimeRate: similarCount > 0 ? `${onTimeRate}%` : "—",
      qualityRate: similarCount > 0 ? `${qualityRate}%` : "—",
      score: clamp(score),
      workload,
      availableOfficers,
      hasEvidence: similarCount > 0,
    };
  }).sort((a, b) => b.score - a.score || b.similarTasksHandled - a.similarTasksHandled).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
