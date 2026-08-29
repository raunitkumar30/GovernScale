import { updateTask as updateLocalStorageTask } from "./localStorage";

export const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in progress",
  SUBMITTED: "submitted",
  COMPLETED: "completed",
  REJECTED: "rejected",
};

// Notify every dashboard/page that task data changed
export const notifyTaskDataChanged = () => {
  window.dispatchEvent(new Event("governscale-data-updated"));
};

// Update a task using centralized localStorage service
export const updateTask = (taskId, updates) => {
  return updateLocalStorageTask(taskId, updates);
};

// Employee submits task
export const submitTask = (taskId) => {
  return updateTask(taskId, {
    status: TASK_STATUS.SUBMITTED,
    submittedAt: new Date().toISOString(),
    verified: false,
    verificationStatus: "pending",
  });
};

// Team verifies task
export const verifyTask = (taskId, verifiedBy = null) => {
  return updateTask(taskId, {
    status: TASK_STATUS.COMPLETED,
    completedAt: new Date().toISOString(),
    verified: true,
    verificationStatus: "verified",
    verifiedBy,
    verifiedAt: new Date().toISOString(),
  });
};

// Team rejects submitted task
export const rejectTask = (taskId, reason = "") => {
  return updateTask(taskId, {
    status: TASK_STATUS.REJECTED,
    verified: false,
    verificationStatus: "rejected",
    rejectionReason: reason,
    rejectedAt: new Date().toISOString(),
  });
};