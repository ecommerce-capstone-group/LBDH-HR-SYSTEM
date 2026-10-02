

export interface Attendance {
  id: number;
  employeeId: number;
  date: string;
  /** Present | Absent */
  status: string;
  lateMinutes: number;
  undertimeMinutes: number;
  overtimeMinutes: number;
  notes?: string | null;
}
