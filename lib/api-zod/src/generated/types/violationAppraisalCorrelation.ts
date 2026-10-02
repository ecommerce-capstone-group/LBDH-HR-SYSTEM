

export interface ViolationAppraisalCorrelation {
  employeeId: number;
  employeeName: string;
  violationCount: number;
  appraisalCount: number;
  avgAppraisalScore?: number | null;
  latestAppraisalPeriod?: string | null;
}
