

export type RequestType = (typeof RequestType)[keyof typeof RequestType];

export const RequestType = {
  overtime: "overtime",
  loan: "loan",
  certificate: "certificate",
  reliever: "reliever",
  training: "training",
} as const;
