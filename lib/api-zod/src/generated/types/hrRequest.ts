
import type { ApprovalStep } from "./approvalStep";
import type { RequestType } from "./requestType";

export interface HrRequest {
  id: number;
  employeeId: number;
  type: RequestType;
  title: string;
  details: string;
  status: string;
  currentStep: string;
  steps: ApprovalStep[];
  createdAt: string;
}
