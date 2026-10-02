

export interface OffboardingInput {
  employeeId: number;
  reason: string;
  exitInterview?: string | null;
  createReplacementJob?: boolean | null;
}
