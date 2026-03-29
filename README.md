# FleetPulse
### Real-Time Fleet Intelligence Platform
> Built for small fleet businesses in Tamil Nadu | 2 Developers | 100% Free

---

##  Problem
Small logistics businesses in Tamil Nadu manage 10-50 vehicles purely via
WhatsApp. No real-time tracking, no fuel theft detection, no predictive
maintenance.

##  Solution
FleetPulse provides:
-  Live GPS tracking on interactive map
-  AI anomaly detection (fuel theft, overspeeding, route deviation)
-  Agentic AI assistant for fleet queries
-  WhatsApp + Email instant alerts
-  Auto-generated daily reports

---

##  System Architecture
```
GPS Simulator (Python + Paho MQTT)
         |
AWS IoT Core → Kinesis Data Stream → Lambda (Python)
         |
ML Anomaly Detection (Scikit-learn)
         |
DynamoDB (trips, alerts, vehicles)
         |
FastAPI Backend ←→ Redis Cache
      |                |
Celery Workers     Socket.io
         |
React Dashboard (Leaflet + Chart.js)
         |
Agentic AI (LangChain + LangGraph + Claude API)
         |
SNS + Twilio (WhatsApp/SMS) + AWS SES (Email)
         |
Prometheus + Grafana + Loki (Monitoring)
         |
GitHub Actions → DockerHub → ArgoCD → AWS EKS
```

---

##  Team

| Person | Role | Branch |
|--------|------|--------|
| Farhana | Cloud, DevOps & Data Pipeline Engineer | `farhana` |
| Nandhana | Backend & Frontend Engineer | `nandhana` |

---

##  Tech Stack
AWS | Docker | Kubernetes | Terraform | Python | FastAPI | React | LangChain | Claude AI

---
