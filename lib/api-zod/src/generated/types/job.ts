
import type { Requirement } from "./requirement";

export interface Job {
  id: number;
  title: string;
  department: string;
  description: string;
  requirements: Requirement[];
  /**
   * Number of staff needed for this listing
   * @minimum 1
   */
  staffNeeded: number;
  /**
   * Count of onboardings for this job with status hired (computed)
   * @minimum 0
   */
  hiredCount: number;
  /** active | closed | filled */
  status: string;
  createdAt: string;
}
