
import type { TrainingCategory } from "./trainingCategory";

export interface TrainingPlanInput {
  year: number;
  category: TrainingCategory;
  title: string;
  description?: string | null;
  trainingHours?: number | null;
  plannedDate?: string | null;
  department?: string | null;
  employeeId?: number | null;
}
