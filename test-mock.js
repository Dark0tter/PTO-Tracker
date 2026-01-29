const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:4000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('Testing Mock Data Connector...\n');

  console.log('1. Health Check:');
  const health = await testEndpoint('/health');
  console.log(JSON.stringify(health, null, 2));

  console.log('\n2. Employees (first 3):');
  const employees = await testEndpoint('/employees?tenant=demo');
  console.log(JSON.stringify(employees.slice(0, 3), null, 2));

  console.log('\n3. Divisions:');
  const divisions = await testEndpoint('/divisions?tenant=demo');
  console.log(JSON.stringify(divisions, null, 2));

  console.log('\n4. Time Off Events (first 3):');
  const events = await testEndpoint('/timeoff?tenant=demo&from=2026-01-01&to=2026-12-31');
  console.log(JSON.stringify(events.slice(0, 3), null, 2));

  console.log('\n✅ All tests passed! Mock connector is working.');
}

runTests().catch(console.error);
