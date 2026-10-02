
import type { IncidentActionTaken } from "./incidentActionTaken";
import type { IncidentStatus } from "./incidentStatus";

export interface EmployeeIncidentUpdate {
  incidentDate?: string | null;
  policyViolated?: string | null;
  violationDescription?: string | null;
  department?: string | null;
  actionTaken?: IncidentActionTaken | null;
  actionDetails?: string | null;
  status?: IncidentStatus | null;
  hrRemarks?: string | null;
  approvingAuthority?: string | null;
  relatedAppraisalPeriod?: string | null;
}
