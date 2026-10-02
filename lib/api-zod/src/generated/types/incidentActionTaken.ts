

export type IncidentActionTaken =
  (typeof IncidentActionTaken)[keyof typeof IncidentActionTaken];

export const IncidentActionTaken = {
  oral_reprimand: "oral_reprimand",
  warning: "warning",
  suspension: "suspension",
  other: "other",
} as const;
