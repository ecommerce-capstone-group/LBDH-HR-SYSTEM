

export interface ApprovalAction {
  /** approve | reject */
  decision: string;
  actor?: string | null;
  note?: string | null;
}
