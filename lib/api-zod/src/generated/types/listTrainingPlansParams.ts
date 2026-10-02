
import type { TrainingCategory } from "./trainingCategory";

export type ListTrainingPlansParams = {
  year?: number;
  category?: TrainingCategory;
  employeeId?: number;
};
