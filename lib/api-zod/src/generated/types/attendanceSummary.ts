

export interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateCount: number;
  totalLateMinutes: number;
  totalUndertimeMinutes: number;
  totalOvertimeMinutes: number;
}
