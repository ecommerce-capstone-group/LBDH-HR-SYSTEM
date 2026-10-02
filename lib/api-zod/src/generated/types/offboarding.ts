

export interface Offboarding {
  id: number;
  employeeId: number;
  reason: string;
  exitInterview: string;
  hrCleared: boolean;
  itCleared: boolean;
  financeCleared: boolean;
  /** Pending | Completed */
  status: string;
  replacementJobId: number | null;
  createdAt: string;
}
