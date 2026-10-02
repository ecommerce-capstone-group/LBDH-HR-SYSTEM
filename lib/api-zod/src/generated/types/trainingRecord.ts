
import type { TrainingCategory } from "./trainingCategory";

export interface TrainingRecord {
  id: number;
  employeeId: number;
  planId?: number | null;
  enrollmentId?: number | null;
  trainingName: string;
  trainingDate: string;
  trainingHours: number;
  trainingType: TrainingCategory;
  /** scheduled | in_progress | completed | cancelled */
  completionStatus: string;
  remarks?: string;
  contractAgreement?: string;
  fileReference?: string;
  createdAt: string;
}
