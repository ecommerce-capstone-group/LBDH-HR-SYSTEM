
import type { TrainingCategory } from "./trainingCategory";

export interface TrainingRecordInput {
  employeeId: number;
  planId?: number | null;
  enrollmentId?: number | null;
  trainingName: string;
  trainingDate: string;
  trainingHours: number;
  trainingType: TrainingCategory;
  completionStatus?: string | null;
  remarks?: string | null;
  contractAgreement?: string | null;
  fileReference?: string | null;
}
