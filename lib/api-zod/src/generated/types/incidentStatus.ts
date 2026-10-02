

export type IncidentStatus =
  (typeof IncidentStatus)[keyof typeof IncidentStatus];

export const IncidentStatus = {
  ongoing: "ongoing",
  resolved: "resolved",
} as const;
