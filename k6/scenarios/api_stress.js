import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '20s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const TOKEN = __ENV.TOKEN || 'your-jwt-token-here';
const BASE_URL = 'http://127.0.0.1:8000';
const HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
};

export default function () {
  const endpoints = [
    `${BASE_URL}/vehicles`,
    `${BASE_URL}/alerts?active_only=true`,
    `${BASE_URL}/analytics/fuel`,
    `${BASE_URL}/analytics/drivers`,
    `${BASE_URL}/health`,
    `${BASE_URL}/settings`,
  ];

  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(url, { headers: HEADERS });

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.1);
}