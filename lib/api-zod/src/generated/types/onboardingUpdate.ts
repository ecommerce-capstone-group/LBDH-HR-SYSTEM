
import type { PreEmploymentRequirement } from './preEmploymentRequirement';

export interface OnboardingUpdate {
  interviewScheduledAt?: string | null;
  interviewNotes?: string | null;
  interviewStatus?: string | null;
  interviewResult?: string | null;
  preEmploymentRequirements?: PreEmploymentRequirement[] | null;
  status?: string | null;
  hrNotes?: string | null;
}
