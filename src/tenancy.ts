import fs from "fs";
import path from "path";
import { TimeOffDataSource } from "./connectors/TimeOffDataSource";
import {
  ViewpointConfig,
  ViewpointForProjectsConnector,
} from "./connectors/ViewpointForProjectsConnector";
import {
  MockConnector,
  MockConnectorConfig,
} from "./connectors/MockConnector";

export type TenantId = string;

export type TenantConnectorConfig =
  | { kind: "viewpointForProjects"; config: ViewpointConfig }
  | { kind: "mock"; config?: MockConnectorConfig }
  | { kind: "none" };

export interface TenantConfig {
  id: TenantId;
  name: string;
  connector: TenantConnectorConfig;
}

export interface TenantsFile {
  tenants: TenantConfig[];
}

const TENANTS_FILE =
  process.env.TENANTS_FILE ||
  path.join(process.cwd(), "tenants.json");

let cachedTenants: TenantsFile | null = null;
let cachedAtMs = 0;

function readTenantsFile(): TenantsFile {
  const raw = fs.readFileSync(TENANTS_FILE, "utf8");
  const parsed = JSON.parse(raw) as TenantsFile;
  if (!parsed?.tenants || !Array.isArray(parsed.tenants)) {
    throw new Error("Invalid tenants file: expected { tenants: TenantConfig[] }");
  }
  return parsed;
}

export function getTenants(): TenantsFile {
  // Basic caching so we don't read disk on every request.
  const now = Date.now();
  if (!cachedTenants || now - cachedAtMs > 5000) {
    cachedTenants = readTenantsFile();
    cachedAtMs = now;
  }
  return cachedTenants;
}

export function resolveTenantIdFromRequest(req: {
  headers: Record<string, unknown>;
  query: Record<string, unknown>;
}): TenantId | null {
  const header = req.headers["x-tenant-id"];
  const query = req.query["tenant"];
  const tenantId = (Array.isArray(header) ? header[0] : header) ?? query;
  if (!tenantId) return null;
  return String(tenantId).trim() || null;
}

export function buildDataSourceForTenant(
  tenantId: TenantId
): { tenant: TenantConfig; dataSource: TimeOffDataSource | null } {
  const { tenants } = getTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  if (!tenant) {
    throw new Error(`Unknown tenant '${tenantId}'`);
  }

  if (tenant.connector.kind === "none") {
    return { tenant, dataSource: null };
  }

  if (tenant.connector.kind === "viewpointForProjects") {
    return {
      tenant,
      dataSource: new ViewpointForProjectsConnector(tenant.connector.config),
    };
  }

  if (tenant.connector.kind === "mock") {
    return {
      tenant,
      dataSource: new MockConnector(tenant.connector.config ?? {}),
    };
  }

  return { tenant, dataSource: null };
}


