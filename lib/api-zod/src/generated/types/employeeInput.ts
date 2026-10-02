

export interface EmployeeInput {
  name: string;
  role: string;
  department: string;
  email: string;
  phone?: string | null;
  licenseName?: string | null;
  licenseExpiry?: string | null;
  documents?: string | null;
  vlBalance?: number | null;
  slBalance?: number | null;
  status?: string | null;
}
