
import type { RequirementAnswer } from "./requirementAnswer";

export interface ApplicantInput {
  jobId: number;
  name: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  resume: string;
  answers: RequirementAnswer[];
}
