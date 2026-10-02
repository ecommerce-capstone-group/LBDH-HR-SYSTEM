
import type { PolicyViolationTrend } from "./policyViolationTrend";
import type { RepeatedViolator } from "./repeatedViolator";
import type { TrainingComplianceItem } from "./trainingComplianceItem";
import type { ViolationAppraisalCorrelation } from "./violationAppraisalCorrelation";

export interface IncidentAnalytics {
  activeIncidents: number;
  resolvedIncidents: number;
  repeatedViolators: RepeatedViolator[];
  policyTrends: PolicyViolationTrend[];
  violationVsAppraisal: ViolationAppraisalCorrelation[];
  trainingCompliance: TrainingComplianceItem[];
}
