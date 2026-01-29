### Vacation Tracker (multi-tenant)

This is the backend API for a marketable vacation tracker. It is **multi-tenant**: each company (“tenant”) provides its own connector configuration (e.g., Viewpoint For Projects).

### What you need to do

- **Install**

```bash
npm install
```

- **Create a tenant config**
  - Copy `tenants.example.json` to `tenants.json`
  - Update the tenant(s) with your real Viewpoint settings (base URL, enterprise ID, token, task folder IDs, custom field names).

- **Run the API**

```bash
npm run dev
```

By default it runs on port **4000** (set `PORT` in your environment if needed).

### How to call the API

All data endpoints require a tenant:

- Provide header: `x-tenant-id: acme`
- Or query param: `?tenant=acme`

Endpoints:

- `GET /health`
- `GET /employees`
- `GET /divisions`
- `GET /timeoff?from=YYYY-MM-DD&to=YYYY-MM-DD`

Examples:

- `GET http://localhost:4000/employees?tenant=acme`
- `GET http://localhost:4000/timeoff?tenant=acme&from=2026-01-01&to=2026-12-31`

### Viewpoint conventions (recommended)

Because Viewpoint For Projects does not expose a dedicated “PTO/Vacation” object, the connector treats **Tasks in a TaskFolder** as time-off events.

For each tenant, configure:

- `timeOffTaskFolderIds`: task folder(s) that contain time-off tasks
- `startDateFieldName`: task custom field that stores the start date
- `endDateFieldName`: task custom field that stores the end date
- `typeFieldName`: task custom field that stores the time-off type (Vacation/Sick/etc.)

### Next steps (what we’ll build next)

- Add a database (Postgres) so tenants can configure themselves in-app (no JSON file).
- Add authentication + roles (Admin/Manager/Employee).
- Add a frontend calendar UI (division filters, coverage view, exports).


