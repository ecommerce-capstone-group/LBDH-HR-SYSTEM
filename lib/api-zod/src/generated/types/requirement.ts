

export interface Requirement {
  label: string;
  /** checkbox | number */
  kind: string;
  weight: number;
  /** for number kind */
  max?: number | null;
}
