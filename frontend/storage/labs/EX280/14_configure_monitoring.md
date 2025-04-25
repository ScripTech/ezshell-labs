---
title: "Configuring Monitoring"
order: 14
description: "Set up application monitoring"
difficulty: "medium"
points: 20
hint: "monitoring-setup-hint"
validationSteps:
  - "Verify ServiceMonitor creation"
  - "Check Prometheus targets"
  - "Validate metrics collection"
  - "Test alerting rules"
---

### Setting Up Application Monitoring

**Question**: Configure monitoring for an application by creating a ServiceMonitor, setting up basic alerts for high CPU usage (>80%) and slow response time (>2s), and expose the metrics endpoint through a Service.

**Answer**:

```yaml
# Create Service with metrics endpoint
apiVersion: v1
kind: Service
metadata:
  name: app-metrics
  labels:
    app: myapp
spec:
  ports:
  - port: 9090
    name: metrics
  selector:
    app: myapp
---
# Create ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: app-monitor
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: metrics
---
# Create PrometheusRule
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: app-alerts
spec:
  groups:
  - name: app.rules
    rules:
    - alert: HighCPUUsage
      expr: container_cpu_usage_seconds_total{container="myapp"} > 0.8
      for: 5m
      labels:
        severity: warning
```

**Additional Notes**:
- Verify metrics endpoint with `curl`
- Check Prometheus targets in web UI
- Test alerts with load testing
- Monitor alert notifications
