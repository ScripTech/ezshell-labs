---
title: "Custom Monitoring and Alerts"
order: 25
description: "Configure custom Prometheus rules and alerts"
difficulty: "hard"
points: 15
hint: "monitoring-hint"
validationSteps:
  - "Verify Prometheus rules"
  - "Check alert configuration"
  - "Test alert firing"
  - "Validate notification"
  - "Monitor alert status"
---

### Custom Monitoring Configuration

**Task**: Configure custom monitoring and alerts with these requirements:

* Create alert rule for high memory usage (>85%)
* Set up alert for pod restart count (>5 in 10m)
* Configure notification to a Slack channel
* Add custom recording rule for HTTP error rate
* Create dashboard for custom metrics

**Solution Steps**:
1. Create PrometheusRule for memory alert:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: custom-alerts
  namespace: openshift-monitoring
spec:
  groups:
  - name: custom.rules
    rules:
    - alert: HighMemoryUsage
      expr: |
        (container_memory_usage_bytes{container!=""} /
         container_spec_memory_limit_bytes{container!=""} * 100) > 85
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: High memory usage detected
        description: Container {{ $labels.container }} is using more than 85% memory
```

2. Configure AlertmanagerConfig:
```yaml
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: slack-notifications
  namespace: openshift-monitoring
spec:
  receivers:
  - name: slack-notifications
    slackConfigs:
    - apiURL:
        key: slack-webhook-url
        name: slack-webhook
      channel: '#openshift-alerts'
      sendResolved: true
  route:
    groupBy: ['alertname']
    receiver: slack-notifications
```

3. Create recording rule for error rate:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: custom-metrics
  namespace: openshift-monitoring
spec:
  groups:
  - name: http.rules
    rules:
    - record: http_error_rate
      expr: |
        sum(rate(http_requests_total{code=~"5.."}[5m])) /
        sum(rate(http_requests_total[5m])) * 100
```

**Verification**:
```bash
# Check rules status
oc -n openshift-monitoring get prometheusrules

# Verify alert configuration
oc -n openshift-monitoring get alertmanagerconfigs

# Test alert
oc -n openshift-monitoring port-forward svc/alertmanager-main 9093:9093

# Query custom metric
curl -k -H "Authorization: Bearer $(oc sa get-token prometheus-k8s)" \
  https://prometheus-k8s.openshift-monitoring:9091/api/v1/query?query=http_error_rate
```

**Expected Results**:
- Alert rules properly configured and active
- Notifications sent to Slack when conditions met
- Custom metrics recorded and queryable
- Dashboard showing relevant metrics
