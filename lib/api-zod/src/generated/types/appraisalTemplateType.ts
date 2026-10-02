

export type AppraisalTemplateType =
  (typeof AppraisalTemplateType)[keyof typeof AppraisalTemplateType];

export const AppraisalTemplateType = {
  non_supervisory: "non_supervisory",
  supervisory: "supervisory",
} as const;
