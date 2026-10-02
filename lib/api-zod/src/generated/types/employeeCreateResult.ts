
import type { Employee } from "./employee";
import type { EmployeeAccountCredentials } from "./employeeAccountCredentials";

export type EmployeeCreateResult = Employee & {
  /** One-time credentials shown to HR after account creation */
  account?: EmployeeAccountCredentials | null;
};
