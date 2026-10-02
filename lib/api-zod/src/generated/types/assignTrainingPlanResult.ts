
import type { TrainingEnrollment } from "./trainingEnrollment";

export interface AssignTrainingPlanResult {
  enrolled: TrainingEnrollment[];
  skippedEmployeeIds: number[];
}
