import { Division, Employee, TimeOffEvent } from "../types";

export interface TimeOffDataSource {
  getEmployees(): Promise<Employee[]>;
  getDivisions(): Promise<Division[]>;
  getTimeOffEvents(params: { from?: Date; to?: Date }): Promise<TimeOffEvent[]>;
}


