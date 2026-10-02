

export interface TrainingEnrollment {
  id: number;
  planId: number;
  employeeId: number;
  /** enrolled | completed | withdrawn */
  status: string;
  createdAt: string;
}
