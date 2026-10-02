
import type { Requirement } from "./requirement";

export interface JobInput {
  title: string;
  department: string;
  description: string;
  requirements: Requirement[];
  /**
   * Number of staff needed (defaults to 1)
   * @minimum 1
   */
  staffNeeded?: number | null;
  /** active | closed | filled */
  status?: string | null;
}
