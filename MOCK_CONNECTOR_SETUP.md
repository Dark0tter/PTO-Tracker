# Mock Data Connector - Setup Complete! 🎉

The Mock Data Connector has been successfully built and integrated into your Vacation Tracker application.

## What Was Built

### 1. MockConnector (`src/connectors/MockConnector.ts`)
A fully functional data source that generates realistic mock data:
- **Employees**: Generates 25-100 employees with realistic names and email addresses
- **Divisions**: Creates 5-10 organizational divisions (Engineering, Sales, HR, etc.)
- **Time-Off Events**: Generates 50-200 time-off events distributed throughout the year
- **Realistic Distribution**: 65% vacation, 25% sick leave, 5% unpaid, 5% other
- **Network Simulation**: Includes artificial delays to simulate API calls

### 2. Integration with Tenancy System
Updated `src/tenancy.ts` to support the new mock connector type:
- Added `MockConnectorConfig` type
- Integrated `MockConnector` into tenant resolution
- Supports multiple tenant configurations with different data sizes

### 3. Configuration Files
- **`tenants.json`**: Active configuration with two mock tenants ready to use
- **`tenants.example.json`**: Updated with mock connector examples
- **`.gitignore`**: Ensures `tenants.json` is not committed (keeps credentials safe)

## Available Mock Tenants

### 1. `demo` - Demo Company
- 25 employees
- 5 divisions
- 50 time-off events
- Perfect for development and demos

### 2. `testco` - Test Company (Large)
- 100 employees
- 10 divisions  
- 200 time-off events
- Great for performance testing

## How to Use

### Start the Backend Server
```bash
cd "k:\Vacation Tracker"
npm run dev
```

### Test the API Endpoints

**Health Check:**
```bash
curl http://localhost:4000/health
```

**Get Employees:**
```bash
curl "http://localhost:4000/employees?tenant=demo"
```

**Get Divisions:**
```bash
curl "http://localhost:4000/divisions?tenant=demo"
```

**Get Time-Off Events:**
```bash
curl "http://localhost:4000/timeoff?tenant=demo&from=2026-01-01&to=2026-12-31"
```

### Start the Frontend
```bash
cd "k:\Vacation Tracker\client"
npm run dev
```

Then open your browser and:
1. The app will load with tenant "acme" by default
2. Change the tenant ID to `demo` or `testco`
3. See the mock data populate immediately!

## Configuration Options

You can customize mock data generation in `tenants.json`:

```json
{
  "id": "custom",
  "name": "Custom Tenant",
  "connector": {
    "kind": "mock",
    "config": {
      "employeeCount": 50,    // Number of employees to generate
      "divisionCount": 8,      // Number of divisions
      "eventCount": 100        // Number of time-off events
    }
  }
}
```

All configuration options are optional. Defaults:
- `employeeCount`: 25
- `divisionCount`: 5
- `eventCount`: 50

## Generated Data

### Employee Names
Uses common first and last names from a predefined list, creating combinations like:
- Emma Smith
- Liam Johnson
- Olivia Williams
- Noah Brown

### Divisions
- Engineering
- Operations
- Sales & Marketing
- Human Resources
- Finance
- IT Services
- Legal
- Customer Success
- Product Management
- Quality Assurance

### Time-Off Events
- Distributed throughout 2026
- Duration: 1-10 days
- Realistic type distribution
- Assigned to employees with their division IDs

## Benefits

✅ **No External Dependencies**: Test without Trimble/Viewpoint API access
✅ **Instant Development**: Start building features immediately
✅ **Predictable Data**: Same data on every load (can add seed support later)
✅ **Configurable Scale**: Test with different data sizes
✅ **Production-Ready**: Same interface as real connectors
✅ **Easy Switching**: Change `kind` from `mock` to `viewpointForProjects` when ready

## Next Steps

While using the mock data, you can:
1. ✅ Test the entire application flow
2. ✅ Build new UI features
3. ✅ Add filtering and search
4. ✅ Create calendar views
5. ✅ Add statistics and reports
6. ✅ Write tests against the mock data
7. ⏳ When Trimble responds, just update `tenants.json` with real credentials

## Adding More Mock Tenants

Simply add new entries to `tenants.json`:

```json
{
  "tenants": [
    {
      "id": "small",
      "name": "Small Company",
      "connector": {
        "kind": "mock",
        "config": {
          "employeeCount": 10,
          "divisionCount": 3,
          "eventCount": 20
        }
      }
    }
  ]
}
```

## Troubleshooting

**Server won't start:**
- Check that port 4000 is available
- Run `npm install` in the root directory

**No data showing:**
- Verify tenant ID matches one in `tenants.json`
- Check browser console for errors
- Ensure backend is running on port 4000

**Want to reset data:**
- Just restart the server - mock data regenerates each time

---

**Ready to go!** The mock connector is fully operational and you can now develop your vacation tracker independently of the Trimble API. 🚀
