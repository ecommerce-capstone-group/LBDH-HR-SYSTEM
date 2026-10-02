
import type { AiRequirementMatch } from "./aiRequirementMatch";

export interface ApplicantAiEvaluation {
  /** 0 to 100 */
  score: number;
  summary: string;
  matches: AiRequirementMatch[];
  model: string;
  evaluatedAt: string;
  categoryCount?: number;
  scoringExplanation?: string;
}
