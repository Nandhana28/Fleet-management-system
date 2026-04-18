import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Alert Handling Scenario
 * Simulates alert creation, retrieval, and resolution
 */

export const options = {
  stages: [
    { duration: '20s', target: 3 },
    { duration: '1m', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
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
  // Get active alerts
  const alertsRes = http.get(`${BASE_URL}/alerts?active_only=true`, { headers: HEADERS });
  check(alertsRes, {
    'alerts: status 200': (r) => r.status === 200,
    'alerts: has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.alerts) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  // Try to resolve an alert if any exist
  try {
    const alertsBody = JSON.parse(alertsRes.body);
    const alerts = alertsBody.alerts || alertsBody;
    
    if (alerts && alerts.length > 0) {
      const alertId = alerts[0].alert_id;
      
      const resolveRes = http.post(
        `${BASE_URL}/alerts/${alertId}/resolve`,
        JSON.stringify({ notes: 'Resolved via load test' }),
        { headers: HEADERS }
      );
      
      check(resolveRes, {
        'resolve alert: status 200': (r) => r.status === 200,
      });
    }
  } catch (e) {
    // Ignore parsing errors
  }

  sleep(1);
}
