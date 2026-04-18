import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Vehicle Tracking Scenario
 * Simulates real-time vehicle tracking with location updates
 */

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // ramp up to 5 users
    { duration: '1m', target: 10 },   // ramp up to 10 users
    { duration: '2m', target: 10 },   // sustained load
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = 'http://127.0.0.1:8000';
const TOKEN = __ENV.TOKEN || 'your-jwt-token-here';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

export default function () {
  // Simulate tracking 3 vehicles
  for (let i = 1; i <= 3; i++) {
    const vehicleId = `vehicle-${i}`;

    // Get vehicle location
    const locRes = http.get(`${BASE_URL}/vehicles/${vehicleId}`, { headers: HEADERS });
    check(locRes, {
      'vehicle location: status 200': (r) => r.status === 200,
      'vehicle location: has coordinates': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.latitude && body.longitude;
        } catch {
          return false;
        }
      },
    });

    sleep(0.5);
  }

  // Get all vehicles
  const allRes = http.get(`${BASE_URL}/vehicles`, { headers: HEADERS });
  check(allRes, {
    'all vehicles: status 200': (r) => r.status === 200,
    'all vehicles: response < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
