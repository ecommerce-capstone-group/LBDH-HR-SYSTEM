
import type { IncidentActionTaken } from "./incidentActionTaken";
import type { IncidentStatus } from "./incidentStatus";

export interface EmployeeIncidentInput {
  employeeId: number;
  incidentDate: string;
  policyViolated: string;
  violationDescription: string;
  department?: string | null;
  actionTaken: IncidentActionTaken;
  actionDetails?: string | null;
  status?: IncidentStatus | null;
  hrRemarks?: string | null;
  approvingAuthority?: string | null;
  relatedAppraisalPeriod?: string | null;
}
