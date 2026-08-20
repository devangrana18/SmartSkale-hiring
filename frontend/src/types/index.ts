export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export type EmployeeStatus = 'Active' | 'Inactive' | 'Pending' | 'Onboarding';

export interface Employee {
  id: number;
  employee_id: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role?: string | null;
  department?: string | null;
  joining_date?: string | null;
  status: EmployeeStatus | string;
  duration?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  stipend?: string | null;
  reference_number?: string | null;
  source: 'google_drive' | 'manual' | string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreatePayload {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  role?: string;
  department?: string;
  joining_date?: string;
  status?: string;
  duration?: string;
  start_date?: string;
  end_date?: string;
  stipend?: string;
  reference_number?: string;
  employee_id?: string;
}

export interface EmployeeUpdatePayload {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: string;
  department?: string;
  joining_date?: string;
  status?: string;
  duration?: string;
  start_date?: string;
  end_date?: string;
  stipend?: string;
  reference_number?: string;
  employee_id?: string;
}

export interface DocumentTemplate {
  id: number;
  name: string;
  document_type: 'offer_letter' | 'internship_certificate' | 'nda' | 'letterhead' | string;
  file_name: string;
  description?: string;
  version: string;
  is_active: boolean;
}

export interface GeneratedDocument {
  id: number;
  employee_id: number;
  employee_name?: string;
  template_id?: number;
  document_type: string;
  document_number?: string;
  generated_by?: string;
  file_path?: string;
  file_name?: string;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  active_employees: number;
  total_employees: number;
  pending_employee_ids: number;
  inactive_employees: number;
  onboarding_employees: number;
  recent_employees: Employee[];
  documents_generated_count: number;
  department_distribution: Record<string, number>;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  total_records_processed: number;
  new_employees_count: number;
  updated_employees_count: number;
  skipped_employees_count: number;
  errors: string[];
}

export interface DocumentFormData {
  document_type: 'offer_letter' | 'internship_certificate' | 'nda' | 'letterhead' | string;
  employee_id?: number | null;
  name: string;
  intern_id?: string;
  email?: string;
  intern_address?: string;
  role?: string;
  department?: string;
  date?: string;
  duration?: string;
  start_date?: string;
  end_date?: string;
  issue_date?: string;
  certificate_no?: string;
  verify_url?: string;
  stipend?: string;
  reference_number?: string;
  custom_content?: string;
}
