
import type { Employee } from './employee';
import type { EmployeeAccountCredentials } from './employeeAccountCredentials';
import type { Onboarding } from './onboarding';

export interface OnboardingCreateEmployeeResult {
  onboarding: Onboarding;
  employee: Employee;
  /** One-time credentials shown to HR after account creation */
  account?: EmployeeAccountCredentials | null;
}
