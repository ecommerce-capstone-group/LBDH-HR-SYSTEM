
import type { RequestType } from "./requestType";

export interface HrRequestInput {
  employeeId: number;
  type: RequestType;
  title: string;
  details: string;
}
