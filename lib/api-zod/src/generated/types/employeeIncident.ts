
import type { IncidentActionTaken } from "./incidentActionTaken";
import type { IncidentStatus } from "./incidentStatus";

export interface EmployeeIncident {
  id: number;
  employeeId: number;
  incidentDate: string;
  policyViolated: string;
  violationDescription: string;
  department: string;
  actionTaken: IncidentActionTaken;
  actionDetails?: string;
  status: IncidentStatus;
  hrRemarks?: string;
  approvingAuthority?: string;
  relatedAppraisalPeriod?: string | null;
  createdAt: string;
}
