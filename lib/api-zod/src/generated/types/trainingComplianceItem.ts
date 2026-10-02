

export interface TrainingComplianceItem {
  planId: number;
  title: string;
  plannedDate?: string | null;
  requiredHours: number;
  completedHours: number;
  compliancePercent: number;
  isCompliant: boolean;
}
