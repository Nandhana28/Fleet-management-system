import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // ramp up
    { duration: '20s', target: 20 },  // sustained load
    { duration: '10s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'],    // less than 1% errors
  },
};

// Set this to a valid JWT token from your app
// Get it from browser: localStorage.getItem('token')
const TOKEN = __ENV.TOKEN || 'your-jwt-token-here';

const BASE_URL = 'http://127.0.0.1:8000';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

export default function () {
  const vehicleId = `vehicle-${Math.floor(Math.random() * 10) + 1}`;

  // Test 1 — List vehicles
  const vehiclesRes = http.get(`${BASE_URL}/vehicles`, { headers: HEADERS });
  check(vehiclesRes, {
    'vehicles: status 200': (r) => r.status === 200,
    'vehicles: response < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.1);

  // Test 2 — Get single vehicle
  const vehicleRes = http.get(`${BASE_URL}/vehicles/${vehicleId}`, { headers: HEADERS });
  check(vehicleRes, {
    'vehicle: status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.1);

  // Test 3 — Get alerts
  const alertsRes = http.get(`${BASE_URL}/alerts?active_only=true`, { headers: HEADERS });
  check(alertsRes, {
    'alerts: status 200': (r) => r.status === 200,
    'alerts: response < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.1);

  // Test 4 — Health check (no auth needed)
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health: status 200': (r) => r.status === 200,
    'health: response < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(0.1);
}