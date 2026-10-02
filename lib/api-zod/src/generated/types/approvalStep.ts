

export interface ApprovalStep {
  /** Unit Head | Department Head | Auto */
  name: string;
  /** pending | approved | rejected */
  status: string;
  actor?: string | null;
  note?: string | null;
  timestamp?: string | null;
}
