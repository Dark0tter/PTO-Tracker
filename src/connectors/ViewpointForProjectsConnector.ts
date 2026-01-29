import axios, { AxiosInstance } from "axios";
import { Division, Employee, TimeOffEvent } from "../types";
import { TimeOffDataSource } from "./TimeOffDataSource";

export interface ViewpointConfig {
  baseUrl: string;
  enterpriseId: string;
  token: string;
  divisionMode: "organisation" | "site" | "project" | "userCustomField";
  divisionCustomFieldName?: string;
  timeOffTaskFolderIds: string[];
  startDateFieldName: string;
  endDateFieldName: string;
  typeFieldName: string;
}

export class ViewpointForProjectsConnector implements TimeOffDataSource {
  private http: AxiosInstance;

  constructor(private config: ViewpointConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl.replace(/\/+$/, ""),
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
    });
  }

  async getEmployees(): Promise<Employee[]> {
    const { enterpriseId } = this.config;
    const res = await this.http.get(
      `/vfp/api/v2/enterprises/${enterpriseId}/users`
    );
    const users = Array.isArray(res.data) ? res.data : res.data?.items ?? [];

    return users.map((u: any) => ({
      id: String(u.id ?? u.userId),
      fullName: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
        (u.displayName ?? ""),
      email: u.email ?? undefined,
      externalRef: String(u.id ?? u.userId),
    }));
  }

  async getDivisions(): Promise<Division[]> {
    const { enterpriseId, divisionMode } = this.config;

    if (divisionMode === "organisation") {
      const res = await this.http.get(
        `/vfp/api/v2/enterprises/${enterpriseId}/organisations`
      );
      const orgs = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      return orgs.map((o: any) => ({
        id: String(o.id ?? o.organisationId),
        name: o.name ?? o.displayName ?? "Organisation",
        externalRef: String(o.id ?? o.organisationId),
      }));
    }

    if (divisionMode === "site") {
      const res = await this.http.get(
        `/vfp/api/v1/enterprises/${enterpriseId}/sites`
      );
      const sites = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      return sites.map((s: any) => ({
        id: String(s.id ?? s.siteId),
        name: s.name ?? s.displayName ?? "Site",
        externalRef: String(s.id ?? s.siteId),
      }));
    }

    if (divisionMode === "project") {
      const res = await this.http.get(
        `/vfp/api/v1/enterprises/${enterpriseId}/documentfolders`
      );
      const projects = Array.isArray(res.data)
        ? res.data
        : res.data?.items ?? [];
      return projects.map((p: any) => ({
        id: String(p.id ?? p.projectId),
        name: p.name ?? p.displayName ?? "Project",
        externalRef: String(p.id ?? p.projectId),
      }));
    }

    // userCustomField mode: divisions are implicit; we expose them via distinct field values later.
    return [];
  }

  async getTimeOffEvents(params: {
    from?: Date;
    to?: Date;
  }): Promise<TimeOffEvent[]> {
    const events: TimeOffEvent[] = [];

    for (const folderId of this.config.timeOffTaskFolderIds) {
      const res = await this.http.get(
        `/vfp/api/v1/taskfolders/${folderId}/tasks`
      );
      const tasks = Array.isArray(res.data) ? res.data : res.data?.items ?? [];

      for (const t of tasks) {
        const taskId = t.id ?? t.taskId;
        if (!taskId) continue;

        const taskRes = await this.http.get(
          `/vfp/api/v3/tasks/${taskId}`
        );
        const fullTask = taskRes.data;

        const customFields = fullTask.customFields ?? {};
        const start = customFields[this.config.startDateFieldName];
        const end = customFields[this.config.endDateFieldName];
        const typeRaw = customFields[this.config.typeFieldName];

        if (!start || !end) continue;

        const startDate = new Date(start);
        const endDate = new Date(end);
        if (params.from && endDate < params.from) continue;
        if (params.to && startDate > params.to) continue;

        const type = this.normaliseType(String(typeRaw ?? "VACATION"));

        const employeeId =
          fullTask.assigneeId ??
          fullTask.assigneeUserId ??
          fullTask.createdByUserId;

        events.push({
          id: String(fullTask.id ?? taskId),
          employeeId: String(employeeId ?? ""),
          type,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          sourceSystem: "VIEWPOINT",
          raw: fullTask,
        });
      }
    }

    return events;
  }

  private normaliseType(raw: string): "VACATION" | "SICK" | "UNPAID" | "OTHER" {
    const v = raw.toLowerCase();
    if (v.includes("vac") || v.includes("holiday")) return "VACATION";
    if (v.includes("sick")) return "SICK";
    if (v.includes("unpaid")) return "UNPAID";
    return "OTHER";
  }
}


