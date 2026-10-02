
import type { PreEmploymentRequirement } from './preEmploymentRequirement';

export interface Onboarding {
  id: number;
  applicantId: number;
  jobId: number;
  employeeId?: number | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  jobTitle: string;
  jobDepartment: string;
  interviewScheduledAt?: string | null;
  interviewNotes: string;
  /** pending | scheduled | completed | passed | failed | cancelled */
  interviewStatus: string;
  interviewResult: string;
  preEmploymentRequirements: PreEmploymentRequirement[];
  /** in_progress | approved | hired | cancelled */
  status: string;
  hrNotes: string;
  createdAt: string;
  updatedAt: string;
}
