

export interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  phone?: string | null;
  licenseName?: string | null;
  /** ISO date string */
  licenseExpiry?: string | null;
  documents?: string | null;
  vlBalance?: number;
  slBalance?: number;
  /** active | offboarding | left */
  status: string;
  createdAt?: string;
}
