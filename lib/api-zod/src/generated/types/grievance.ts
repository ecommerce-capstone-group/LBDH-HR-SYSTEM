

export interface Grievance {
  id: number;
  employeeId: number;
  subject: string;
  description: string;
  /** open | resolved */
  status: string;
  createdAt: string;
}
