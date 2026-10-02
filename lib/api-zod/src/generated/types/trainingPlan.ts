
import type { ApprovalStep } from "./approvalStep";
import type { TrainingCategory } from "./trainingCategory";

export interface TrainingPlan {
  id: number;
  year: number;
  category: TrainingCategory;
  title: string;
  description?: string;
  trainingHours?: number;
  plannedDate?: string | null;
  department?: string | null;
  employeeId?: number | null;
  /** draft | published | pending | approved | rejected */
  status: string;
  currentStep: string;
  steps: ApprovalStep[];
  createdAt: string;
}
