

export interface RequirementMatch {
  label: string;
  kind: string;
  value: boolean | number;
  score: number;
  weight: number;
}
