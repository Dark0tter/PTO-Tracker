# API Documentation

## Overview

The PTO Tracker API provides RESTful endpoints for managing employee time-off data across multiple tenants/organizations.

**Base URL:** `http://localhost:4000`

**Authentication:** Tenant-based via query parameter or header

---

## Endpoints

### Health Check

Get server status and uptime information.

**Endpoint:** `GET /health`

**Parameters:** None

**Response:**
```json
{
  "status": "ok",
  "multiTenant": true,
  "timestamp": "2026-01-28T12:00:00.000Z",
  "uptime": 123.456
}
```

**Status Codes:**
- `200` - Success

---

### Get Employees

Retrieve list of all employees for a tenant.

**Endpoint:** `GET /employees`

**Parameters:**
| Name | Type | Required | Location | Description |
|------|------|----------|----------|-------------|
| tenant | string | Yes | Query or Header | Tenant identifier |

**Example Request:**
```bash
curl "http://localhost:4000/employees?tenant=demo"
# or
curl -H "x-tenant-id: demo" "http://localhost:4000/employees"
```

**Response:**
```json
[
  {
    "id": "emp-1",
    "fullName": "Emma Smith",
    "email": "emma.smith@mockcompany.com",
    "divisionId": "div-1",
    "externalRef": "MOCK-EMP-1"
  },
  {
    "id": "emp-2",
    "fullName": "Liam Johnson",
    "email": "liam.johnson@mockcompany.com",
    "divisionId": "div-2",
    "externalRef": "MOCK-EMP-2"
  }
]
```

**Status Codes:**
- `200` - Success
- `400` - Missing tenant parameter
- `500` - Server error
- `501` - Tenant connector not configured

---

### Get Divisions

Retrieve list of all divisions/departments for a tenant.

**Endpoint:** `GET /divisions`

**Parameters:**
| Name | Type | Required | Location | Description |
|------|------|----------|----------|-------------|
| tenant | string | Yes | Query or Header | Tenant identifier |

**Example Request:**
```bash
curl "http://localhost:4000/divisions?tenant=demo"
```

**Response:**
```json
[
  {
    "id": "div-1",
    "name": "Engineering",
    "externalRef": "MOCK-DIV-1"
  },
  {
    "id": "div-2",
    "name": "Operations",
    "externalRef": "MOCK-DIV-2"
  }
]
```

**Status Codes:**
- `200` - Success
- `400` - Missing tenant parameter
- `500` - Server error
- `501` - Tenant connector not configured

---

### Get Time-Off Events

Retrieve time-off events for a tenant, optionally filtered by date range.

**Endpoint:** `GET /timeoff`

**Parameters:**
| Name | Type | Required | Location | Description |
|------|------|----------|----------|-------------|
| tenant | string | Yes | Query or Header | Tenant identifier |
| from | string (YYYY-MM-DD) | No | Query | Start date filter (inclusive) |
| to | string (YYYY-MM-DD) | No | Query | End date filter (inclusive) |

**Example Request:**
```bash
curl "http://localhost:4000/timeoff?tenant=demo&from=2026-01-01&to=2026-12-31"
```

**Response:**
```json
[
  {
    "id": "event-1",
    "employeeId": "emp-1",
    "divisionId": "div-1",
    "type": "VACATION",
    "startDate": "2026-07-01T00:00:00.000Z",
    "endDate": "2026-07-10T00:00:00.000Z",
    "sourceSystem": "INTERNAL",
    "raw": {}
  },
  {
    "id": "event-2",
    "employeeId": "emp-2",
    "divisionId": "div-2",
    "type": "SICK",
    "startDate": "2026-03-15T00:00:00.000Z",
    "endDate": "2026-03-17T00:00:00.000Z",
    "sourceSystem": "INTERNAL",
    "raw": {}
  }
]
```

**Time-Off Types:**
- `VACATION` - Paid vacation/holiday
- `SICK` - Sick leave
- `UNPAID` - Unpaid leave
- `OTHER` - Other types of leave

**Status Codes:**
- `200` - Success
- `400` - Missing tenant parameter or invalid date format
- `500` - Server error
- `501` - Tenant connector not configured

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

In development mode, errors may include a stack trace:

```json
{
  "error": "Error message description",
  "stack": "Error: ...\n  at ..."
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production deployments.

---

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.

---

## Examples

### Get all data for a tenant

```bash
#!/bin/bash

TENANT="demo"
API_BASE="http://localhost:4000"

# Get employees
echo "Fetching employees..."
curl "${API_BASE}/employees?tenant=${TENANT}"

# Get divisions
echo "Fetching divisions..."
curl "${API_BASE}/divisions?tenant=${TENANT}"

# Get time-off events
echo "Fetching time-off events..."
curl "${API_BASE}/timeoff?tenant=${TENANT}&from=2026-01-01&to=2026-12-31"
```

### PowerShell Example

```powershell
$tenant = "demo"
$apiBase = "http://localhost:4000"

# Get employees
$employees = Invoke-RestMethod -Uri "$apiBase/employees?tenant=$tenant"
Write-Host "Found $($employees.Count) employees"

# Get time-off events
$events = Invoke-RestMethod -Uri "$apiBase/timeoff?tenant=$tenant&from=2026-01-01&to=2026-12-31"
Write-Host "Found $($events.Count) events"
```

### JavaScript/TypeScript Example

```typescript
const API_BASE = 'http://localhost:4000'
const TENANT = 'demo'

async function fetchData() {
  const params = new URLSearchParams({ tenant: TENANT })
  
  // Fetch all data in parallel
  const [employees, divisions, events] = await Promise.all([
    fetch(`${API_BASE}/employees?${params}`).then(r => r.json()),
    fetch(`${API_BASE}/divisions?${params}`).then(r => r.json()),
    fetch(`${API_BASE}/timeoff?${params}&from=2026-01-01&to=2026-12-31`).then(r => r.json())
  ])
  
  return { employees, divisions, events }
}
```

---

## Webhook Support

Webhooks are not currently supported but could be added for real-time notifications when time-off events are created, updated, or deleted.

---

## Future Enhancements

Potential API improvements:
- Authentication/Authorization (JWT, OAuth)
- Pagination for large result sets
- Filtering and sorting options
- Bulk operations
- Webhook subscriptions
- Rate limiting
- API versioning
- OpenAPI/Swagger documentation
