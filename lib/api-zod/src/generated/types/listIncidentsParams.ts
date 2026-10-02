
import type { IncidentStatus } from "./incidentStatus";

export type ListIncidentsParams = {
  employeeId?: number;
  status?: IncidentStatus;
};
