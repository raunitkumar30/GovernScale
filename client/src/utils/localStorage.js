// =====================================================
// GOVERN SCALE - LOCAL STORAGE
// =====================================================
//
// Temporary frontend data layer.
//
// Prototype flow:
//
// Government
//    ↓
// Mission
//    ↓
// Department
//    ↓
// Organization
//    ↓
// Team
//    ↓
// Employee
//    ↓
// Employee Task
//
// =====================================================


// =====================================================
// STORAGE KEYS
// =====================================================

const MISSIONS_KEY =
  "governscale_missions";

const DEPARTMENT_ALLOCATIONS_KEY =
  "governscale_department_allocations";

const ORGANIZATION_ALLOCATIONS_KEY =
  "governscale_organization_allocations";

const TEAM_ALLOCATIONS_KEY =
  "governscale_team_allocations";

const EMPLOYEE_ALLOCATIONS_KEY =
  "governscale_employee_allocations";

const TASKS_KEY =
  "governscale_tasks";


// =====================================================
// GENERATE ID
// =====================================================

const generateId = (prefix) => {

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;

};


// =====================================================
// GENERIC READ STORAGE
// =====================================================

const readStorage = (key) => {

  try {

    const data =
      localStorage.getItem(key);


    if (!data) {

      return [];

    }


    const parsedData =
      JSON.parse(data);


    return Array.isArray(
      parsedData
    )
      ? parsedData
      : [];

  } catch (error) {

    console.error(
      `Failed to read ${key}:`,
      error
    );

    return [];

  }

};


// =====================================================
// GENERIC WRITE STORAGE
// =====================================================

const writeStorage = (
  key,
  data
) => {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(data)
    );


    return true;

  } catch (error) {

    console.error(
      `Failed to write ${key}:`,
      error
    );


    return false;

  }

};


// =====================================================
// MISSION FUNCTIONS
// =====================================================


// Get all missions

export const getMissions = () => {

  return readStorage(
    MISSIONS_KEY
  );

};


// Save missions

export const saveMissions = (
  missions
) => {

  return writeStorage(
    MISSIONS_KEY,
    missions
  );

};


// Get mission by ID

export const getMissionById = (
  missionId
) => {

  const missions =
    getMissions();


  return missions.find(
    (mission) =>
      mission.id ===
      missionId
  );

};


// =====================================================
// CREATE GOVERNMENT MISSION
// =====================================================

export const createMission = (
  missionData
) => {

  const missions =
    getMissions();


  const newMission = {

    id:
      generateId(
        "mission"
      ),

    title:
      missionData.title ||
      "",

    description:
      missionData.description ||
      "",

    target:
      Number(
        missionData.target
      ) || 0,

    deadline:
      missionData.deadline ||
      "",

    priority:
      missionData.priority ||
      "Medium",

    departments:
      Array.isArray(
        missionData.departments
      )
        ? [
          ...missionData.departments,
        ]
        : [],

    createdBy:
      "Government",

    status:
      "Active",

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

  };


  saveMissions([

    ...missions,

    newMission,

  ]);


  return newMission;

};


// =====================================================
// CREATE GOVERNMENT MISSION WITH DEPARTMENT TASKS
// =====================================================

export const createGovernmentMissionWithTasks = (
  missionData
) => {

  // ---------------------------------------------
  // CREATE MISSION
  // ---------------------------------------------

  const newMission =
    createMission(
      missionData
    );


  // ---------------------------------------------
  // SELECTED DEPARTMENTS
  // ---------------------------------------------

  const departments =
    Array.isArray(
      missionData.departments
    )
      ? missionData.departments
      : [];


  // ---------------------------------------------
  // CREATE DEPARTMENT TASKS
  // ---------------------------------------------

  const createdTasks =
    departments.map(
      (department) => {

        return createTask({

          missionId:
            newMission.id,

          department:
            department,

          organization:
            "",

          team:
            "",

          title:
            missionData.title ||
            "Government Mission",

          description:
            missionData.description ||
            "",

          assignedTo:
            "",

          assignedLevel:
            "department",

          createdBy:
            "Government",

          priority:
            missionData.priority ||
            "Medium",

          dueDate:
            missionData.deadline ||
            "",

          status:
            "Pending",

        });

      }
    );


  return {

    mission:
      newMission,

    tasks:
      createdTasks,

  };

};


// =====================================================
// UPDATE MISSION
// =====================================================

export const updateMission = (
  missionId,
  updates
) => {

  const missions =
    getMissions();


  const updatedMissions =
    missions.map(
      (mission) => {

        if (
          mission.id !==
          missionId
        ) {

          return mission;

        }


        return {

          ...mission,

          ...updates,

          updatedAt:
            new Date().toISOString(),

        };

      }
    );


  saveMissions(
    updatedMissions
  );


  return updatedMissions.find(
    (mission) =>
      mission.id ===
      missionId
  );

};


// =====================================================
// DELETE MISSION
// =====================================================

export const deleteMission = (
  missionId
) => {

  // ---------------------------------------------
  // DELETE MISSION
  // ---------------------------------------------

  const missions =
    getMissions();


  saveMissions(

    missions.filter(
      (mission) =>
        mission.id !==
        missionId
    )

  );


  // ---------------------------------------------
  // DELETE DEPARTMENT ALLOCATIONS
  // ---------------------------------------------

  const departmentAllocations =
    getDepartmentAllocations();


  saveDepartmentAllocations(

    departmentAllocations.filter(
      (allocation) =>
        allocation.missionId !==
        missionId
    )

  );


  // ---------------------------------------------
  // DELETE ORGANIZATION ALLOCATIONS
  // ---------------------------------------------

  const organizationAllocations =
    getOrganizationAllocations();


  saveOrganizationAllocations(

    organizationAllocations.filter(
      (allocation) =>
        allocation.missionId !==
        missionId
    )

  );


  // ---------------------------------------------
  // DELETE TEAM ALLOCATIONS
  // ---------------------------------------------

  const teamAllocations =
    getTeamAllocations();


  saveTeamAllocations(

    teamAllocations.filter(
      (allocation) =>
        allocation.missionId !==
        missionId
    )

  );


  // ---------------------------------------------
  // DELETE EMPLOYEE ALLOCATIONS
  // ---------------------------------------------

  const employeeAllocations =
    getEmployeeAllocations();


  saveEmployeeAllocations(

    employeeAllocations.filter(
      (allocation) =>
        allocation.missionId !==
        missionId
    )

  );


  // ---------------------------------------------
  // DELETE TASKS
  // ---------------------------------------------

  const tasks =
    getTasks();


  saveTasks(

    tasks.filter(
      (task) =>
        task.missionId !==
        missionId
    )

  );


  return true;

};


// =====================================================
// DEPARTMENT ALLOCATION FUNCTIONS
// =====================================================

export const getDepartmentAllocations = () => {

  return readStorage(
    DEPARTMENT_ALLOCATIONS_KEY
  );

};


export const saveDepartmentAllocations = (
  allocations
) => {

  return writeStorage(
    DEPARTMENT_ALLOCATIONS_KEY,
    allocations
  );

};


export const getDepartmentAllocationsByMission =
  (missionId) => {

    const allocations =
      getDepartmentAllocations();


    return allocations.filter(
      (allocation) =>
        allocation.missionId ===
        missionId
    );

  };


export const getDepartmentAllocationsByDepartment =
  (departmentName) => {

    const allocations =
      getDepartmentAllocations();


    return allocations.filter(
      (allocation) =>
        allocation.department ===
        departmentName
    );

  };


// =====================================================
// CREATE DEPARTMENT ALLOCATION
// =====================================================

export const createDepartmentAllocation = (
  allocationData
) => {

  const allocations =
    getDepartmentAllocations();


  const mission =
    getMissionById(
      allocationData.missionId
    );


  if (!mission) {

    throw new Error(
      "Mission not found."
    );

  }


  const newAllocation = {

    id:
      generateId(
        "department_allocation"
      ),

    missionId:
      allocationData.missionId,

    department:
      allocationData.department,

    allocatedTarget:
      Number(
        allocationData.allocatedTarget
      ) || 0,

    status:
      "Pending",

    createdBy:
      "Government",

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

  };


  saveDepartmentAllocations([

    ...allocations,

    newAllocation,

  ]);


  return newAllocation;

};


// =====================================================
// UPDATE DEPARTMENT ALLOCATION
// =====================================================

export const updateDepartmentAllocation = (
  allocationId,
  updates
) => {

  const allocations =
    getDepartmentAllocations();


  const updatedAllocations =
    allocations.map(
      (allocation) => {

        if (
          allocation.id !==
          allocationId
        ) {

          return allocation;

        }


        return {

          ...allocation,

          ...updates,

          allocatedTarget:
            updates.allocatedTarget !==
              undefined
              ? Number(
                updates.allocatedTarget
              )
              : allocation.allocatedTarget,

          updatedAt:
            new Date().toISOString(),

        };

      }
    );


  saveDepartmentAllocations(
    updatedAllocations
  );


  return updatedAllocations.find(
    (allocation) =>
      allocation.id ===
      allocationId
  );

};


// =====================================================
// DELETE DEPARTMENT ALLOCATION
// =====================================================

export const deleteDepartmentAllocation = (
  allocationId
) => {

  const allocations =
    getDepartmentAllocations();


  saveDepartmentAllocations(

    allocations.filter(
      (allocation) =>
        allocation.id !==
        allocationId
    )

  );


  return true;

};


// =====================================================
// ORGANIZATION ALLOCATION FUNCTIONS
// =====================================================

export const getOrganizationAllocations = () => {

  return readStorage(
    ORGANIZATION_ALLOCATIONS_KEY
  );

};


export const saveOrganizationAllocations = (
  allocations
) => {

  return writeStorage(
    ORGANIZATION_ALLOCATIONS_KEY,
    allocations
  );

};


export const getOrganizationAllocationsByMission =
  (missionId) => {

    const allocations =
      getOrganizationAllocations();


    return allocations.filter(
      (allocation) =>
        allocation.missionId ===
        missionId
    );

  };


export const getOrganizationAllocationsByDepartment =
  (departmentName) => {

    const allocations =
      getOrganizationAllocations();


    return allocations.filter(
      (allocation) =>
        allocation.department ===
        departmentName
    );

  };


// =====================================================
// CREATE ORGANIZATION ALLOCATION
// =====================================================

export const createOrganizationAllocation = (
  allocationData
) => {

  const allocations =
    getOrganizationAllocations();


  const newAllocation = {

    id:
      generateId(
        "organization_allocation"
      ),

    missionId:
      allocationData.missionId,

    department:
      allocationData.department,

    organization:
      allocationData.organization,

    allocatedTarget:
      Number(
        allocationData.allocatedTarget
      ) || 0,

    status:
      "Pending",

    createdBy:
      "Department",

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

  };


  saveOrganizationAllocations([

    ...allocations,

    newAllocation,

  ]);


  return newAllocation;

};


// =====================================================
// UPDATE ORGANIZATION ALLOCATION
// =====================================================

export const updateOrganizationAllocation = (
  allocationId,
  updates
) => {

  const allocations =
    getOrganizationAllocations();


  const updatedAllocations =
    allocations.map(
      (allocation) => {

        if (
          allocation.id !==
          allocationId
        ) {

          return allocation;

        }


        return {

          ...allocation,

          ...updates,

          allocatedTarget:
            updates.allocatedTarget !==
              undefined
              ? Number(
                updates.allocatedTarget
              )
              : allocation.allocatedTarget,

          updatedAt:
            new Date().toISOString(),

        };

      }
    );


  saveOrganizationAllocations(
    updatedAllocations
  );


  return updatedAllocations.find(
    (allocation) =>
      allocation.id ===
      allocationId
  );

};


// =====================================================
// DELETE ORGANIZATION ALLOCATION
// =====================================================

export const deleteOrganizationAllocation = (
  allocationId
) => {

  const allocations =
    getOrganizationAllocations();


  saveOrganizationAllocations(

    allocations.filter(
      (allocation) =>
        allocation.id !==
        allocationId
    )

  );


  return true;

};


// =====================================================
// TEAM ALLOCATION FUNCTIONS
// =====================================================

export const getTeamAllocations = () => {

  return readStorage(
    TEAM_ALLOCATIONS_KEY
  );

};


export const saveTeamAllocations = (
  allocations
) => {

  return writeStorage(
    TEAM_ALLOCATIONS_KEY,
    allocations
  );

};


export const getTeamAllocationsByMission =
  (missionId) => {

    const allocations =
      getTeamAllocations();


    return allocations.filter(
      (allocation) =>
        allocation.missionId ===
        missionId
    );

  };


export const getTeamAllocationsByOrganization =
  (organizationName) => {

    const allocations =
      getTeamAllocations();


    return allocations.filter(
      (allocation) =>
        allocation.organization ===
        organizationName
    );

  };


// =====================================================
// CREATE TEAM ALLOCATION
// =====================================================

export const createTeamAllocation = (
  allocationData
) => {

  const allocations =
    getTeamAllocations();


  const newAllocation = {

    id:
      generateId(
        "team_allocation"
      ),

    missionId:
      allocationData.missionId,

    department:
      allocationData.department,

    organization:
      allocationData.organization,

    team:
      allocationData.team,

    allocatedTarget:
      Number(
        allocationData.allocatedTarget
      ) || 0,

    status:
      "Pending",

    createdBy:
      "Organization",

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

  };


  saveTeamAllocations([

    ...allocations,

    newAllocation,

  ]);


  return newAllocation;

};


// =====================================================
// UPDATE TEAM ALLOCATION
// =====================================================

export const updateTeamAllocation = (
  allocationId,
  updates
) => {

  const allocations =
    getTeamAllocations();


  const updatedAllocations =
    allocations.map(
      (allocation) => {

        if (
          allocation.id !==
          allocationId
        ) {

          return allocation;

        }


        return {

          ...allocation,

          ...updates,

          allocatedTarget:
            updates.allocatedTarget !==
              undefined
              ? Number(
                updates.allocatedTarget
              )
              : allocation.allocatedTarget,

          updatedAt:
            new Date().toISOString(),

        };

      }
    );


  saveTeamAllocations(
    updatedAllocations
  );


  return updatedAllocations.find(
    (allocation) =>
      allocation.id ===
      allocationId
  );

};


// =====================================================
// DELETE TEAM ALLOCATION
// =====================================================

export const deleteTeamAllocation = (
  allocationId
) => {

  const allocations =
    getTeamAllocations();


  saveTeamAllocations(

    allocations.filter(
      (allocation) =>
        allocation.id !==
        allocationId
    )

  );


  return true;

};


// =====================================================
// EMPLOYEE ALLOCATION FUNCTIONS
// =====================================================
//
// Team divides its allocated target among employees.
//
// Team
//    ↓
// Employee Allocation
//    ↓
// Employee
//
// Example:
//
// Team Target = 20
//
// Aarav Sharma → 5
// Priya Verma  → 5
// Rahul Singh  → 10
//
// =====================================================


// =====================================================
// GET ALL EMPLOYEE ALLOCATIONS
// =====================================================

export const getEmployeeAllocations = () => {

  return readStorage(
    EMPLOYEE_ALLOCATIONS_KEY
  );

};


// =====================================================
// SAVE EMPLOYEE ALLOCATIONS
// =====================================================

export const saveEmployeeAllocations = (
  allocations
) => {

  return writeStorage(
    EMPLOYEE_ALLOCATIONS_KEY,
    allocations
  );

};


// =====================================================
// GET EMPLOYEE ALLOCATIONS BY MISSION
// =====================================================

export const getEmployeeAllocationsByMission = (
  missionId
) => {

  const allocations =
    getEmployeeAllocations();


  return allocations.filter(
    (allocation) =>
      allocation.missionId ===
      missionId
  );

};


// =====================================================
// GET EMPLOYEE ALLOCATIONS BY TEAM
// =====================================================

export const getEmployeeAllocationsByTeam = (
  teamName
) => {

  const allocations =
    getEmployeeAllocations();


  return allocations.filter(
    (allocation) =>
      allocation.team ===
      teamName
  );

};


// =====================================================
// GET EMPLOYEE ALLOCATIONS BY EMPLOYEE
// =====================================================

export const getEmployeeAllocationsByEmployee = (
  employeeId
) => {

  const allocations =
    getEmployeeAllocations();


  return allocations.filter(
    (allocation) =>
      allocation.employeeId ===
      employeeId
  );

};


// =====================================================
// CREATE EMPLOYEE ALLOCATION
// =====================================================

export const createEmployeeAllocation = (
  allocationData
) => {

  const allocations =
    getEmployeeAllocations();


  // ---------------------------------------------
  // VALIDATION
  // ---------------------------------------------

  if (
    !allocationData.missionId
  ) {

    throw new Error(
      "Mission is required."
    );

  }


  if (
    !allocationData.employeeId
  ) {

    throw new Error(
      "Employee is required."
    );

  }


  if (
    !allocationData.employee
  ) {

    throw new Error(
      "Employee name is required."
    );

  }


  if (
    !allocationData.team
  ) {

    throw new Error(
      "Team is required."
    );

  }


  const allocatedTarget =
    Number(
      allocationData.allocatedTarget
    );


  if (
    !Number.isFinite(
      allocatedTarget
    ) ||
    allocatedTarget <= 0
  ) {

    throw new Error(
      "Employee target must be greater than zero."
    );

  }


  // ---------------------------------------------
  // CREATE ALLOCATION
  // ---------------------------------------------

  const newAllocation = {

    id:
      generateId(
        "employee_allocation"
      ),

    missionId:
      allocationData.missionId,

    department:
      allocationData.department ||
      "",

    organization:
      allocationData.organization ||
      "",

    team:
      allocationData.team,

    employeeId:
      allocationData.employeeId,

    employee:
      allocationData.employee,

    allocatedTarget:
      allocatedTarget,

    status:
      allocationData.status ||
      "Pending",

    createdBy:
      allocationData.createdBy ||
      "Team",

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

  };


  // ---------------------------------------------
  // SAVE
  // ---------------------------------------------

  saveEmployeeAllocations([

    ...allocations,

    newAllocation,

  ]);


  return newAllocation;

};


// =====================================================
// UPDATE EMPLOYEE ALLOCATION
// =====================================================

export const updateEmployeeAllocation = (
  allocationId,
  updates
) => {

  const allocations =
    getEmployeeAllocations();


  const updatedAllocations =
    allocations.map(
      (allocation) => {

        if (
          allocation.id !==
          allocationId
        ) {

          return allocation;

        }


        const updatedAllocation = {

          ...allocation,

          ...updates,

          updatedAt:
            new Date().toISOString(),

        };


        if (
          updates.allocatedTarget !==
          undefined
        ) {

          const target =
            Number(
              updates.allocatedTarget
            );


          if (
            !Number.isFinite(
              target
            ) ||
            target <= 0
          ) {

            throw new Error(
              "Employee target must be greater than zero."
            );

          }


          updatedAllocation
            .allocatedTarget =
            target;

        }


        return updatedAllocation;

      }
    );


  saveEmployeeAllocations(
    updatedAllocations
  );


  return updatedAllocations.find(
    (allocation) =>
      allocation.id ===
      allocationId
  );

};


// =====================================================
// DELETE EMPLOYEE ALLOCATION
// =====================================================

export const deleteEmployeeAllocation = (
  allocationId
) => {

  const allocations =
    getEmployeeAllocations();


  saveEmployeeAllocations(

    allocations.filter(
      (allocation) =>
        allocation.id !==
        allocationId
    )

  );


  return true;

};


// =====================================================
// TASK FUNCTIONS
// =====================================================


// Get all tasks

export const getTasks = () => {

  return readStorage(
    TASKS_KEY
  );

};


// Save tasks

export const saveTasks = (
  tasks
) => {

  return writeStorage(
    TASKS_KEY,
    tasks
  );

};


// Get task by ID

export const getTaskById = (
  taskId
) => {

  const tasks =
    getTasks();


  return tasks.find(
    (task) =>
      task.id ===
      taskId
  );

};


// =====================================================
// CREATE TASK
// =====================================================
//
// Can create:
//
// department task
// organization task
// team task
// employee task
//
// =====================================================

export const createTask = (
  taskData
) => {

  const tasks =
    getTasks();


  const newTask = {

    id:
      generateId(
        "task"
      ),

    missionId:
      taskData.missionId ||
      null,

    department:
      taskData.department ||
      "",

    organization:
      taskData.organization ||
      "",

    team:
      taskData.team ||
      "",

    employeeId:
      taskData.employeeId ||
      "",

    employee:
      taskData.employee ||
      "",

    title:
      taskData.title ||
      "",

    description:
      taskData.description ||
      "",

    assignedTo:
      taskData.assignedTo ||
      "",

    assignedLevel:
      taskData.assignedLevel ||
      "employee",

    createdBy:
      taskData.createdBy ||
      "Team",

    category:
      taskData.category ||
      "General",

    complexity:
      taskData.complexity ||
      "Medium",

    priority:
      taskData.priority ||
      "Medium",

    dueDate:
      taskData.dueDate ||
      "",

    target:
      Number(
        taskData.target
      ) || 0,

    status:
      taskData.status ||
      "Pending",

    statusLog:
      taskData.statusLog || [
        {
          from: null,
          to: taskData.status || "Pending",
          timestamp: new Date().toISOString(),
          changedBy: taskData.createdBy || "Supervisor",
        },
      ],

    proof:
      taskData.proof ||
      null,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

  };


  saveTasks([

    ...tasks,

    newTask,

  ]);


  return newTask;

};


// =====================================================
// GET TASKS FOR MISSION
// =====================================================

export const getMissionTasks = (
  missionId
) => {

  const tasks =
    getTasks();


  return tasks.filter(
    (task) =>
      task.missionId ===
      missionId
  );

};


// =====================================================
// GET TASKS FOR DEPARTMENT
// =====================================================

export const getDepartmentTasks = (
  departmentName
) => {

  const tasks =
    getTasks() || [];

  const deptNorm =
    String(departmentName || "").trim().toLowerCase();

  let validOrgs = [];
  try {
    const rawOrgs = localStorage.getItem("governscale_organizations");
    if (rawOrgs) {
      const parsed = JSON.parse(rawOrgs);
      if (Array.isArray(parsed)) {
        validOrgs = parsed
          .filter((o) => (o.department || "").trim().toLowerCase() === deptNorm)
          .map((o) => (o.name || "").trim().toLowerCase());
      }
    }
  } catch (e) {
    validOrgs = [];
  }

  // Fallback defaults if not in localStorage yet
  if (validOrgs.length === 0) {
    const fallbackMap = {
      "education department": [
        "scholarship services",
        "citizen education services",
        "digital education",
        "document services",
        "student support services",
      ],
      "healthcare department": [
        "health services",
        "health data services",
        "public health bureau",
        "medical supplies division",
      ],
      "citizen services department": [
        "document services",
        "citizen service team",
        "citizen support services",
      ],
    };
    validOrgs = fallbackMap[deptNorm] || [];
  }

  return tasks.filter(
    (task) => {
      const tDept = String(task.department || task.assignedDepartment || "").trim().toLowerCase();
      const tOrg = String(task.organization || "").trim().toLowerCase();
      return tDept === deptNorm || validOrgs.includes(tOrg);
    }
  );

};


// =====================================================
// GET TASKS FOR ORGANIZATION
// =====================================================

export const getOrganizationTasks = (
  organizationName
) => {

  const tasks =
    getTasks();


  return tasks.filter(
    (task) =>
      task.organization ===
      organizationName
  );

};


// =====================================================
// GET TASKS FOR TEAM
// =====================================================

export const getTeamTasks = (
  teamName
) => {

  const tasks =
    getTasks();


  return tasks.filter(
    (task) =>
      task.team ===
      teamName
  );

};


// =====================================================
// GET TASKS FOR EMPLOYEE
// =====================================================

export const getEmployeeTasks = (
  employeeName
) => {

  const tasks =
    getTasks();


  return tasks.filter(
    (task) =>
      task.assignedTo ===
      employeeName
  );

};


// =====================================================
// GET TASKS FOR EMPLOYEE BY ID
// =====================================================

export const getEmployeeTasksById = (
  employeeId
) => {

  const tasks =
    getTasks();


  return tasks.filter(
    (task) =>
      task.employeeId ===
      employeeId
  );

};


// =====================================================
// UPDATE TASK
// =====================================================

export const updateTask = (
  taskId,
  updates
) => {

  const tasks =
    getTasks();


  const updatedTasks =
    tasks.map(
      (task) => {

        if (
          task.id !==
          taskId
        ) {

          return task;

        }


        const currentStatusLog = Array.isArray(task.statusLog) ? [...task.statusLog] : [];
        if (updates.status && updates.status !== task.status) {
          currentStatusLog.push({
            from: task.status,
            to: updates.status,
            timestamp: new Date().toISOString(),
            changedBy: updates.changedBy || updates.employeeName || "Officer",
            notes: updates.evidenceNotes || updates.rejectionReason || "",
          });
        }

        return {

          ...task,

          ...updates,

          statusLog: currentStatusLog,

          updatedAt:
            new Date().toISOString(),

        };

      }
    );


  saveTasks(
    updatedTasks
  );


  return updatedTasks.find(
    (task) =>
      task.id ===
      taskId
  );

};


// =====================================================
// DELETE TASK
// =====================================================

export const deleteTask = (
  taskId
) => {

  const tasks =
    getTasks();


  saveTasks(

    tasks.filter(
      (task) =>
        task.id !==
        taskId
    )

  );


  return true;

};


// =====================================================
// COMPLETE TASK
// =====================================================
//
// Employee uses this when completing a task.
// =====================================================

export const completeTask = (
  taskId,
  proof = null
) => {

  return updateTask(

    taskId,

    {

      status:
        "Completed",

      proof:
        proof,

      completedAt:
        new Date().toISOString(),

    }

  );

};


// =====================================================
// VALIDATE ALLOCATION TOTAL
// =====================================================

export const validateAllocationTotal = (
  allocations,
  parentTarget
) => {

  const total =
    allocations.reduce(
      (
        sum,
        allocation
      ) =>

        sum +
        Number(
          allocation.allocatedTarget
        ),

      0
    );


  return {

    valid:
      total <=
      Number(
        parentTarget
      ),

    total:

      total,

    remaining:

      Math.max(

        Number(
          parentTarget
        ) -
        total,

        0

      ),

    exceeded:

      Math.max(

        total -
        Number(
          parentTarget
        ),

        0

      ),

  };

};


// =====================================================
// CLEAR ALL GOVERN SCALE DATA
// =====================================================
export const clearGovernScaleData = () => {
  const keys = [
    MISSIONS_KEY,
    DEPARTMENT_ALLOCATIONS_KEY,
    ORGANIZATION_ALLOCATIONS_KEY,
    TEAM_ALLOCATIONS_KEY,
    EMPLOYEE_ALLOCATIONS_KEY,
    TASKS_KEY,
    "governscale_score_snapshots",
    "governscale_role_weights",
    "governscale_departments",
    "governscale_organizations",
    "governscale_teams",
    "governscale_employees",
    "tasks",
    "governmentTasks",
    "organizationTasks",
    "employeeTasks",
    "teamTasks",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new Event("governscale-data-updated"));
};

// =====================================================
// PHASE 10: BACKUP & RESTORE ENTIRE LOCALSTORAGE STATE
// =====================================================

export const exportEntireStateBackup = () => {
  const backup = {
    exportedAt: new Date().toISOString(),
    version: "2.0-SIH25250",
    missions: getMissions(),
    departmentAllocations: getDepartmentAllocations(),
    organizationAllocations: getOrganizationAllocations(),
    teamAllocations: getTeamAllocations(),
    employeeAllocations: getEmployeeAllocations(),
    tasks: getTasks(),
    departments: JSON.parse(localStorage.getItem("governscale_departments") || "null"),
    organizations: JSON.parse(localStorage.getItem("governscale_organizations") || "null"),
    teams: JSON.parse(localStorage.getItem("governscale_teams") || "null"),
    employees: JSON.parse(localStorage.getItem("governscale_employees") || "null"),
    roleWeights: JSON.parse(localStorage.getItem("governscale_role_weights") || "null"),
    snapshots: JSON.parse(localStorage.getItem("governscale_score_snapshots") || "[]"),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GovernScale_Full_State_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const restoreEntireStateBackup = (jsonString) => {
  try {
    const data = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
    if (data.missions) localStorage.setItem(MISSIONS_KEY, JSON.stringify(data.missions));
    if (data.departmentAllocations) localStorage.setItem(DEPARTMENT_ALLOCATIONS_KEY, JSON.stringify(data.departmentAllocations));
    if (data.organizationAllocations) localStorage.setItem(ORGANIZATION_ALLOCATIONS_KEY, JSON.stringify(data.organizationAllocations));
    if (data.teamAllocations) localStorage.setItem(TEAM_ALLOCATIONS_KEY, JSON.stringify(data.teamAllocations));
    if (data.employeeAllocations) localStorage.setItem(EMPLOYEE_ALLOCATIONS_KEY, JSON.stringify(data.employeeAllocations));
    if (data.tasks) localStorage.setItem(TASKS_KEY, JSON.stringify(data.tasks));
    if (data.departments) localStorage.setItem("governscale_departments", JSON.stringify(data.departments));
    if (data.organizations) localStorage.setItem("governscale_organizations", JSON.stringify(data.organizations));
    if (data.teams) localStorage.setItem("governscale_teams", JSON.stringify(data.teams));
    if (data.employees) localStorage.setItem("governscale_employees", JSON.stringify(data.employees));
    if (data.roleWeights) localStorage.setItem("governscale_role_weights", JSON.stringify(data.roleWeights));
    if (data.snapshots) localStorage.setItem("governscale_score_snapshots", JSON.stringify(data.snapshots));

    window.dispatchEvent(new Event("governscale-data-updated"));
    return { success: true };
  } catch (err) {
    console.error("Failed to restore state backup:", err);
    return { success: false, error: err.message };
  }
};

// =====================================================
// PHASE 10: SEED FULL SIH25250 BENCHMARK DATASET
// =====================================================
export const seedSIH25250BenchmarkData = () => {
  clearGovernScaleData();

  // 1. Benchmark Missions
  const missions = [
    {
      id: "m-sih-01",
      title: "State Scholarship Verification Drive",
      description: "Fast-track verification and disbursement of higher education scholarship applications across districts.",
      target: 10000,
      priority: "High",
      category: "scholarship",
      departments: ["Education Department", "Healthcare Department"],
      deadline: "2026-10-31",
      status: "In Progress",
      createdAt: new Date().toISOString(),
    },
    {
      id: "m-sih-02",
      title: "National Health Card Verification Campaign",
      description: "Digital validation of public medical records and citizen health cards.",
      target: 8000,
      priority: "High",
      category: "health",
      departments: ["Healthcare Department"],
      deadline: "2026-11-15",
      status: "In Progress",
      createdAt: new Date().toISOString(),
    },
  ];

  // 2. Department Allocations
  const deptAllocations = [
    { id: "da-1", missionId: "m-sih-01", department: "Education Department", allocatedTarget: 6000 },
    { id: "da-2", missionId: "m-sih-01", department: "Healthcare Department", allocatedTarget: 4000 },
    { id: "da-3", missionId: "m-sih-02", department: "Healthcare Department", allocatedTarget: 8000 },
  ];

  // 3. Organization Allocations
  const orgAllocations = [
    { id: "oa-1", missionId: "m-sih-01", department: "Education Department", organization: "Scholarship Services", allocatedTarget: 4000 },
    { id: "oa-2", missionId: "m-sih-01", department: "Education Department", organization: "Citizen Education Services", allocatedTarget: 2000 },
    { id: "oa-3", missionId: "m-sih-01", department: "Healthcare Department", organization: "Health Services", allocatedTarget: 4000 },
    { id: "oa-4", missionId: "m-sih-02", department: "Healthcare Department", organization: "Health Data Services", allocatedTarget: 8000 },
  ];

  // 4. Team Allocations
  const teamAllocations = [
    { id: "ta-1", missionId: "m-sih-01", department: "Education Department", organization: "Scholarship Services", team: "Scholarship Verification Team", allocatedTarget: 2500 },
    { id: "ta-2", missionId: "m-sih-01", department: "Education Department", organization: "Scholarship Services", team: "Application Processing Team", allocatedTarget: 1500 },
    { id: "ta-3", missionId: "m-sih-01", department: "Healthcare Department", organization: "Health Services", team: "Health Application Team", allocatedTarget: 4000 },
  ];

  // 5. Rich Multi-Tier Tasks matching SIH25250 Employee Roster
  const now = new Date();
  const tasks = [
    // Aarav Sharma (Score ~92)
    {
      id: "tsk-01",
      missionId: "m-sih-01",
      title: "Verify Merit Scholarship Batch #101",
      description: "Review uploaded academic transcripts and income certificates.",
      department: "Education Department",
      organization: "Scholarship Services",
      team: "Scholarship Verification Team",
      employeeName: "Aarav Sharma",
      employeeId: "emp-01",
      priority: "High",
      target: 200,
      verifiedTarget: 200,
      complexity: "Medium",
      status: "Completed",
      dueDate: new Date(now.getTime() + 86400000 * 5).toISOString().slice(0, 10),
      evidenceUrl: "https://documents.gov.in/proof/batch-101.pdf",
      evidenceNotes: "All 200 applications cross-checked with state university registry.",
      statusLog: [
        { from: "Pending", to: "In Progress", timestamp: new Date(now.getTime() - 86400000 * 3).toISOString(), changedBy: "Aarav Sharma" },
        { from: "In Progress", to: "Pending Verification", timestamp: new Date(now.getTime() - 86400000 * 1).toISOString(), changedBy: "Aarav Sharma" },
        { from: "Pending Verification", to: "Completed", timestamp: new Date().toISOString(), changedBy: "Aarav Sharma" },
      ],
    },
    // Priya Verma (Score ~88)
    {
      id: "tsk-02",
      missionId: "m-sih-01",
      title: "District Income Certificate Validation #102",
      description: "Verify revenue department seals on district applicant records.",
      department: "Education Department",
      organization: "Scholarship Services",
      team: "Scholarship Verification Team",
      employeeName: "Priya Verma",
      employeeId: "emp-02",
      priority: "High",
      target: 180,
      verifiedTarget: 180,
      complexity: "High",
      status: "Completed",
      dueDate: new Date(now.getTime() + 86400000 * 4).toISOString().slice(0, 10),
      evidenceUrl: "https://revenue.gov.in/seals/batch-102.pdf",
      evidenceNotes: "Revenue seals confirmed genuine via API.",
      statusLog: [
        { from: "Pending", to: "In Progress", timestamp: new Date(now.getTime() - 86400000 * 4).toISOString(), changedBy: "Priya Verma" },
        { from: "In Progress", to: "Pending Verification", timestamp: new Date(now.getTime() - 86400000 * 2).toISOString(), changedBy: "Priya Verma" },
        { from: "Pending Verification", to: "Completed", timestamp: new Date().toISOString(), changedBy: "Priya Verma" },
      ],
    },
    // Rohan Gupta (Score ~71 - Behind / Overdue)
    {
      id: "tsk-03",
      missionId: "m-sih-01",
      title: "Bank Account IFSC Discrepancy Verification",
      description: "Contact lead bank for dormant account updates.",
      department: "Education Department",
      organization: "Scholarship Services",
      team: "Scholarship Verification Team",
      employeeName: "Rohan Gupta",
      employeeId: "emp-03",
      priority: "High",
      target: 150,
      complexity: "High",
      status: "In Progress",
      dueDate: new Date(now.getTime() - 86400000 * 2).toISOString().slice(0, 10), // OVERDUE
      statusLog: [
        { from: "Pending", to: "In Progress", timestamp: new Date(now.getTime() - 86400000 * 5).toISOString(), changedBy: "Rohan Gupta" },
      ],
    },
    // Ananya Desai (Score ~95 - Exemplary)
    {
      id: "tsk-04",
      missionId: "m-sih-01",
      title: "Minority Scholarship Quota Clearance",
      description: "Verify minority welfare department quota applications.",
      department: "Education Department",
      organization: "Scholarship Services",
      team: "Scholarship Verification Team",
      employeeName: "Ananya Desai",
      employeeId: "emp-04",
      priority: "Medium",
      target: 250,
      verifiedTarget: 250,
      complexity: "Medium",
      status: "Completed",
      dueDate: new Date(now.getTime() + 86400000 * 7).toISOString().slice(0, 10),
      evidenceUrl: "https://minoritywelfare.gov.in/clearance-q3.pdf",
      evidenceNotes: "Completed 2 days before deadline.",
      statusLog: [
        { from: "Pending", to: "In Progress", timestamp: new Date(now.getTime() - 86400000 * 6).toISOString(), changedBy: "Ananya Desai" },
        { from: "In Progress", to: "Pending Verification", timestamp: new Date(now.getTime() - 86400000 * 2).toISOString(), changedBy: "Ananya Desai" },
        { from: "Pending Verification", to: "Completed", timestamp: new Date().toISOString(), changedBy: "Ananya Desai" },
      ],
    },
    // Vikram Rao (Score ~60 - Bottleneck / Needs redistribution)
    {
      id: "tsk-05",
      missionId: "m-sih-01",
      title: "Out-of-State Student Record Verification",
      description: "Cross-validate out-of-state matriculation credentials.",
      department: "Education Department",
      organization: "Scholarship Services",
      team: "Scholarship Verification Team",
      employeeName: "Vikram Rao",
      employeeId: "emp-05",
      priority: "High",
      target: 120,
      complexity: "High",
      status: "In Progress",
      dueDate: new Date(now.getTime() - 86400000 * 1).toISOString().slice(0, 10), // OVERDUE
      statusLog: [
        { from: "Pending", to: "In Progress", timestamp: new Date(now.getTime() - 86400000 * 4).toISOString(), changedBy: "Vikram Rao" },
      ],
    },
  ];

  localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
  localStorage.setItem(DEPARTMENT_ALLOCATIONS_KEY, JSON.stringify(deptAllocations));
  localStorage.setItem(ORGANIZATION_ALLOCATIONS_KEY, JSON.stringify(orgAllocations));
  localStorage.setItem(TEAM_ALLOCATIONS_KEY, JSON.stringify(teamAllocations));
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

  window.dispatchEvent(new Event("governscale-data-updated"));
  return { success: true };
};