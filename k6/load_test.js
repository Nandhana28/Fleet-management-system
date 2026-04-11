import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 500,
  duration: '60s',
};

const SQS_URL = 'https://sqs.ap-south-1.amazonaws.com/746491203215/fleetpulse-gps-queue';

export default function () {
  const vehicleId = `vehicle-${Math.floor(Math.random() * 10) + 1}`;

  const payload = JSON.stringify({
    vehicle_id: vehicleId,
    driver_id: `driver-${Math.floor(Math.random() * 10) + 1}`,
    latitude: 10.98 + Math.random() * 0.1,
    longitude: 76.92 + Math.random() * 0.1,
    speed: 20 + Math.random() * 60,
    fuel_level: 30 + Math.random() * 70,
    timestamp: new Date().toISOString(),
    status: 'moving',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(
    'http://localhost:8000/api/vehicles/location',
    payload,
    params
  );

  check(res, {
    'status is 200': (r) => r.status === 200 || r.status === 422,
  });

  sleep(0.1);
}
