---
title: "Configuring Application Reliability"
order: 4
description: "Implement health checks and auto-scaling"
difficulty: "hard"
points: 25
hint: "reliability-config-hint"
validationSteps:
  - "Verify HPA creation"
  - "Check probe configuration"
  - "Validate scaling behavior"
  - "Test failover"
---

### Implementing Application Reliability

**Question**: Configure a deployment named 'web-app' with liveness and readiness probes, and set up Horizontal Pod Autoscaling to maintain CPU usage around 70% with 2-5 replicas.

**Answer**:
```bash
# Add probes to deployment
oc set probe deployment/web-app \
  --liveness --get-url=http://:8080/health \
  --initial-delay-seconds=30 --timeout-seconds=1
oc set probe deployment/web-app \
  --readiness --get-url=http://:8080/ready \
  --initial-delay-seconds=10 --timeout-seconds=1

# Configure HPA
oc autoscale deployment/web-app \
  --min=2 --max=5 --cpu-percent=70
```

**Explanation**:
- Configures both liveness and readiness probes
- Sets appropriate delays and timeouts
- Implements horizontal pod autoscaling
- Ensures high availability and performance
