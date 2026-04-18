#!/bin/bash
# Seed vehicle locations directly to Redis

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-1:location" '{"latitude":11.0168,"longitude":76.9558,"speed":35.5,"fuel_level":78.2,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"Gandhipuram Bus Stand","dest":"Coimbatore Airport","progress":45.0,"odometer":12500.0,"driver_fatigue":0}'

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-2:location" '{"latitude":10.9987,"longitude":76.9508,"speed":42.1,"fuel_level":65.3,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"RS Puram","dest":"Peelamedu","progress":32.5,"odometer":8900.0,"driver_fatigue":0}'

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-3:location" '{"latitude":10.9847,"longitude":76.9762,"speed":28.7,"fuel_level":82.1,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"Ukkadam","dest":"Singanallur","progress":58.0,"odometer":15200.0,"driver_fatigue":0}'

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-4:location" '{"latitude":11.0130,"longitude":77.0180,"speed":51.2,"fuel_level":71.5,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"Tidel Park","dest":"Podanur Junction","progress":22.0,"odometer":6500.0,"driver_fatigue":0}'

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-5:location" '{"latitude":11.0080,"longitude":76.9720,"speed":38.9,"fuel_level":75.8,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"Saibaba Colony","dest":"Ganapathy","progress":40.0,"odometer":11200.0,"driver_fatigue":0}'

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-6:location" '{"latitude":11.0050,"longitude":76.9650,"speed":45.3,"fuel_level":68.9,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"Race Course","dest":"Vadavalli","progress":35.5,"odometer":9800.0,"driver_fatigue":0}'

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-7:location" '{"latitude":11.0200,"longitude":76.9600,"speed":32.1,"fuel_level":79.4,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"Hopes College","dest":"Kuniyamuthur","progress":50.0,"odometer":13500.0,"driver_fatigue":0}'

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-8:location" '{"latitude":10.9500,"longitude":76.9650,"speed":41.7,"fuel_level":72.6,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"Kovaipudur","dest":"Thondamuthur","progress":28.0,"odometer":7900.0,"driver_fatigue":0}'

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-9:location" '{"latitude":11.0330,"longitude":77.1200,"speed":36.4,"fuel_level":76.1,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"Sulur","dest":"Kaniyur","progress":55.0,"odometer":14800.0,"driver_fatigue":0}'

docker exec fleetpulse-redis redis-cli SET "vehicle:vehicle-10:location" '{"latitude":11.0400,"longitude":76.9700,"speed":48.2,"fuel_level":69.7,"status":"moving","timestamp":"2026-04-18T12:00:00","source":"Mettupalayam Road","dest":"Avinashi Road","progress":42.0,"odometer":10500.0,"driver_fatigue":0}'

echo "✅ Seeded 10 vehicles to Redis"
