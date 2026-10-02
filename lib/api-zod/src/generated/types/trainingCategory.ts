

export type TrainingCategory =
  (typeof TrainingCategory)[keyof typeof TrainingCategory];

export const TrainingCategory = {
  doh_initiated: "doh_initiated",
  hospital_required: "hospital_required",
  departmental_request: "departmental_request",
} as const;
