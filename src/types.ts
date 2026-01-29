export type DivisionId = string;
export type EmployeeId = string;

export interface Division {
  id: DivisionId;
  name: string;
  externalRef?: string;
}

export interface Employee {
  id: EmployeeId;
  fullName: string;
  email?: string;
  divisionId?: DivisionId;
  externalRef?: string;
}

export type TimeOffType = "VACATION" | "SICK" | "UNPAID" | "OTHER";

export interface TimeOffEvent {
  id: string;
  employeeId: EmployeeId;
  divisionId?: DivisionId;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  sourceSystem: "VIEWPOINT" | "INTERNAL";
  raw?: unknown;
}


