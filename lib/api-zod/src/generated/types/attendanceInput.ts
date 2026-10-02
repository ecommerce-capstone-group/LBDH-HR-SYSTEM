

export interface AttendanceInput {
  employeeId: number;
  date: string;
  status: string;
  lateMinutes?: number | null;
  undertimeMinutes?: number | null;
  overtimeMinutes?: number | null;
  notes?: string | null;
}
