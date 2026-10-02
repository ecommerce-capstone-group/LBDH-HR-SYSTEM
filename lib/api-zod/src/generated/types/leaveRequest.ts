
import type { ApprovalStep } from "./approvalStep";

export interface LeaveRequest {
  id: number;
  employeeId: number;
  /** VL | SL */
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  /** pending | approved | rejected */
  status: string;
  currentStep: string;
  steps: ApprovalStep[];
  createdAt: string;
}
