import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '20s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
  },
};

const BASE_URL = 'http://127.0.0.1:8000';

export default function () {
  // Health check simulates high frequency GPS polling
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health ok': (r) => r.status === 200,
    'fast response': (r) => r.timings.duration < 200,
  });
  sleep(0.05);
}