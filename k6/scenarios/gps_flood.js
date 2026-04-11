import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({
    vehicle_id: `vehicle-${Math.floor(Math.random() * 10) + 1}`,
    latitude: 10.98 + Math.random() * 0.1,
    longitude: 76.92 + Math.random() * 0.1,
    speed: Math.random() * 120,
    fuel_level: Math.random() * 100,
    timestamp: new Date().toISOString(),
    status: 'moving',
  });

  http.post('http://localhost:8000/api/vehicles/location',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  sleep(0.05);
}
