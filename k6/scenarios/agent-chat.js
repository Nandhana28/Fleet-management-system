import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Agent Chat Scenario
 * Simulates AI agent interactions with streaming responses
 */

export const options = {
  stages: [
    { duration: '15s', target: 2 },
    { duration: '45s', target: 3 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // Agent responses can be slower
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = 'http://127.0.0.1:8000';
const TOKEN = __ENV.TOKEN || 'your-jwt-token-here';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

const QUERIES = [
  'What is the current status of vehicle-1?',
  'Show me active alerts',
  'How much fuel does vehicle-3 have?',
  'List all vehicles in moving status',
  'What is the average speed across the fleet?',
];

export default function () {
  const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];

  // Send chat message
  const chatRes = http.post(
    `${BASE_URL}/agent/chat`,
    JSON.stringify({
      message: query,
      stream: false,  // Set to true for streaming in real scenario
    }),
    { headers: HEADERS }
  );

  check(chatRes, {
    'agent chat: status 200': (r) => r.status === 200,
    'agent chat: has response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.response || body.message;
      } catch {
        return false;
      }
    },
    'agent chat: response < 5s': (r) => r.timings.duration < 5000,
  });

  sleep(2);
}
