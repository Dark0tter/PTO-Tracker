### PTO Tracker

A modern, multi-tenant vacation/time-off tracking application with powerful analytics, calendar views, and flexible data connectors.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.19-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)

## ✨ Features

### � **Authentication & Security**
- JWT-based authentication
- Role-based access control (Admin/User)
- Secure password hashing
- Persistent login sessions
- Multi-tenant user isolation

### �📊 **Multiple View Modes**
- **List View** - Chronological list of time-off events with advanced filtering
- **Calendar Grid** - Visual monthly calendar with event overlays
- **Statistics Dashboard** - Analytics, metrics, and insights

### 🔍 **Advanced Filtering**
- Search employees by name
- Filter by division/department
- Filter by time-off type (vacation, sick, unpaid, other)
- Custom date range selection
- Multiple filters work together seamlessly

### 📈 **Analytics Dashboard**
- Key metrics (total days, average per employee, event count)
- Time-off type breakdown with visual charts
- Top 10 employees leaderboard
- Division averages comparison
- Busiest days identification
- Coverage gap alerts (when 30%+ of team is off)

### 🏢 **Multi-Tenant Architecture**
- Support multiple organizations/companies
- Isolated data per tenant
- Flexible connector system

### 🔌 **Data Connectors**
- **Mock Connector** - Generate realistic test data instantly
- **Viewpoint for Projects** - Integration with Trimble Viewpoint API
- Extensible architecture for adding custom connectors

### 🎨 **Modern UI**
- Dark theme with green accents
- Responsive design (desktop, tablet, mobile)
- Real-time filtering and updates
- Smooth animations and transitions

## 🚀 Quick Start

### Prerequisites
- **Node.js 20.19+** or **22.12+** (required for Vite 7)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dark0tter/PTO-Tracker.git
   cd PTO-Tracker
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

5. **Set up tenant configuration**
   ```bash
   cp tenants.example.json tenants.json
   # tenants.json is already configured with mock data
   ```

### Running the Application

**Development Mode:**

1. **Start the backend** (Terminal 1):
   ```bash
   npm run dev
   ```
   Backend runs on http://localhost:4000

2. **Start the frontend** (Terminal 2):
   ```bash
   cd client
   npm run dev
   ```
   Frontend runs on http://localhost:5173

3. **Open your browser** to http://localhost:5173

4. **Log in** with demo credentials:
   - Username: `demo` / Password: `demo123` (Demo tenant)
   - Username: `admin` / Password: `admin123` (ACME tenant)
   - Username: `test` / Password: `test123` (Test tenant)

See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete authentication documentation.

### Using Mock Data

The app comes pre-configured with mock tenants. Each user is automatically logged into their assigned tenant:

- **demo** user → Demo tenant (25 employees, 5 divisions, 50 events)
- **test** user → Test tenant (100 employees, 10 divisions, 200 events)
- **admin** user → ACME tenant (Viewpoint integration)

## 📖 API Documentation

### Endpoints

#### Health Check
```http
GET /health
```
Returns server status and uptime.

**Response:**
```json
{
  "status": "ok",
  "multiTenant": true,
  "timestamp": "2026-01-28T12:00:00.000Z",
  "uptime": 123.456
}
```

#### Get Employees
```http
GET /employees?tenant=demo
```
Returns list of employees for the specified tenant.

**Query Parameters:**
- `tenant` (required) - Tenant ID

**Response:**
```json
[
  {
    "id": "emp-1",
    "fullName": "Emma Smith",
    "email": "emma.smith@mockcompany.com",
    "divisionId": "div-1",
    "externalRef": "MOCK-EMP-1"
  }
]
```

#### Get Divisions
```http
GET /divisions?tenant=demo
```
Returns list of divisions/departments for the specified tenant.

**Query Parameters:**
- `tenant` (required) - Tenant ID

**Response:**
```json
[
  {
    "id": "div-1",
    "name": "Engineering",
    "externalRef": "MOCK-DIV-1"
  }
]
```

#### Get Time-Off Events
```http
GET /timeoff?tenant=demo&from=2026-01-01&to=2026-12-31
```
Returns time-off events for the specified tenant and date range.

**Query Parameters:**
- `tenant` (required) - Tenant ID
- `from` (optional) - Start date (YYYY-MM-DD)
- `to` (optional) - End date (YYYY-MM-DD)

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
    "sourceSystem": "INTERNAL"
  }
]
```

### Authentication

Currently uses tenant-based routing via query parameter or header:
- Query: `?tenant=demo`
- Header: `x-tenant-id: demo`

## 🔧 Configuration

### Tenant Configuration

Edit `tenants.json` to configure tenants and data sources:

```json
{
  "tenants": [
    {
      "id": "demo",
      "name": "Demo Company",
      "connector": {
        "kind": "mock",
        "config": {
          "employeeCount": 25,
          "divisionCount": 5,
          "eventCount": 50
        }
      }
    }
  ]
}
```

### Connector Types

#### Mock Connector
Perfect for development and testing:
```json
{
  "kind": "mock",
  "config": {
    "employeeCount": 100,
    "divisionCount": 10,
    "eventCount": 200
  }
}
```

#### Viewpoint for Projects
Integration with Trimble Viewpoint:
```json
{
  "kind": "viewpointForProjects",
  "config": {
    "baseUrl": "https://your-viewpoint-domain",
    "enterpriseId": "123",
    "token": "your-api-token",
    "divisionMode": "organisation",
    "timeOffTaskFolderIds": ["folder-id"],
    "startDateFieldName": "StartDate",
    "endDateFieldName": "EndDate",
    "typeFieldName": "TimeOffType"
  }
}
```

## 🏗️ Project Structure

```
PTO-Tracker/
├── src/                      # Backend source
│   ├── connectors/           # Data source connectors
│   │   ├── MockConnector.ts
│   │   ├── ViewpointForProjectsConnector.ts
│   │   └── TimeOffDataSource.ts
│   ├── server.ts             # Express server
│   ├── tenancy.ts            # Multi-tenant logic
│   └── types.ts              # TypeScript types
├── client/                   # Frontend source
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Dashboard.tsx
│   │   │   └── CalendarGrid.tsx
│   │   ├── utils/            # Utilities
│   │   │   ├── statistics.ts
│   │   │   └── calendar.ts
│   │   ├── App.tsx           # Main app component
│   │   ├── App.css           # Styling
│   │   └── types.ts          # TypeScript types
│   └── package.json
├── tenants.json              # Tenant configuration
├── tenants.example.json      # Example configuration
├── package.json              # Backend dependencies
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Axios** - HTTP client (for Viewpoint connector)
- **CORS** - Cross-origin support

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite 7** - Build tool
- **CSS3** - Styling (no frameworks!)

## 📦 Building for Production

### Backend
```bash
npm run build
npm start
```

### Frontend
```bash
cd client
npm run build
```

Build output is in `client/dist/` - can be served statically.

## 🧪 Development

### Adding a New Connector

1. Create a new connector class implementing `TimeOffDataSource`:
```typescript
export class MyConnector implements TimeOffDataSource {
  async getEmployees(): Promise<Employee[]> { /* ... */ }
  async getDivisions(): Promise<Division[]> { /* ... */ }
  async getTimeOffEvents(params: { from?: Date; to?: Date }): Promise<TimeOffEvent[]> { /* ... */ }
}
```

2. Add to `tenancy.ts`:
```typescript
if (tenant.connector.kind === "myConnector") {
  return {
    tenant,
    dataSource: new MyConnector(tenant.connector.config),
  };
}
```

3. Update `TenantConnectorConfig` type and add to `tenants.json`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built for tracking employee vacation and time-off
- Designed for integration with Trimble Viewpoint for Projects
- Mock data connector for development without external dependencies

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Made with ❤️ for better vacation planning**
 (multi-tenant)

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


