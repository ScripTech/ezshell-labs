---
title: "LGTM Observability Stack"
order: 32
description: "Deploy Loki, Grafana, Tempo, Mimir observability stack"
difficulty: "expert"
points: 20
hint: "lgtm-stack-hint"
validationSteps:
  - "Verify component deployment"
  - "Test data collection"
  - "Check dashboards"
  - "Validate alerting"
  - "Monitor performance"
---

### LGTM Stack Configuration

**Task**: Deploy the LGTM observability stack with these requirements:

* Deploy Loki for log aggregation
* Configure Grafana with custom dashboards
* Set up Prometheus with Mimir for metrics
* Configure cross-component data correlation
* Implement alerting rules

**Solution Steps**:
1. Deploy Loki with persistent storage:
```yaml
apiVersion: loki.grafana.com/v1
kind: LokiStack
metadata:
  name: logging
  namespace: openshift-logging
spec:
  size: 1x.small
  storage:
    schemas:
    - version: v12
      effectiveDate: "2022-06-01"
    secret:
      name: lokistack-dev-s3
    storageClass: standard
  tenants:
    mode: openshift-logging
```

2. Configure Grafana Operator:
```yaml
apiVersion: grafana.integreatly.org/v1beta1
kind: Grafana
metadata:
  name: grafana
  namespace: observability
spec:
  deployment:
    envs:
    - name: GF_AUTH_DISABLE_LOGIN_FORM
      value: "true"
    - name: GF_AUTH_ANONYMOUS_ENABLED
      value: "true"
  dashboardLabelSelector:
    - matchExpressions:
        - key: app
          operator: In
          values:
            - grafana
```

3. Set up Mimir for metrics:
```yaml
apiVersion: monitoring.grafana.com/v1alpha1
kind: Mimir
metadata:
  name: demo
spec:
  replicas: 1
  storage:
    enableSharding: true
    blockStorage:
      backend: s3
      s3:
        endpoint: s3.amazonaws.com
        secretAccessKey:
          name: mimir-s3
          key: secretKey
```

4. Configure correlation:
```yaml
apiVersion: integreatly.org/v1alpha1
kind: GrafanaDataSource
metadata:
  name: lgtm-datasources
spec:
  datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus-operated:9090
  - name: Loki
    type: loki
    url: http://loki-gateway:8080
  - name: Tempo
    type: tempo
    url: http://tempo-query-frontend:3200
```

**Verification**:
```bash
# Check component status
oc get pods -n observability

# Test log ingestion
oc logs deploy/loki-gateway -n observability

# Access Grafana
oc get route grafana -n observability

# Query metrics
curl -X GET http://prometheus-operated:9090/api/v1/query?query=up

# Test alerts
oc exec -it alertmanager-0 -- amtool alert
```

**Expected Results**:
- All components deployed and running
- Data collection working
- Dashboards accessible
- Alerts functioning
- Cross-component correlation working
