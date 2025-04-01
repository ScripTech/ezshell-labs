---
title: "Monitoring Cluster Health"
order: 5
description: "Monitor and troubleshoot OpenShift cluster health"
difficulty: "medium"
points: 12
hint: "monitoring-hint"
validationSteps:
  - "Check cluster metrics"
  - "Verify alerting rules"
  - "Test monitoring stack"
  - "Validate log aggregation"
  - "Review resource usage"
---

### Monitoring Cluster Health

**Question**: How do you monitor OpenShift cluster health? Specify tools and metrics for identifying issues like resource exhaustion.

**Answer**:
- **Tools**:
  - OpenShift Console, Prometheus, Grafana, Alertmanager.
- **Metrics**:
  - CPU/memory usage (`oc adm top nodes`).
  - Pod status (`oc get pods`).
  - Node health (`oc get nodes`).
  - Etcd latency.

**Additional Notes**:
- Set custom alerts in Alertmanager.
- Review logs and metrics regularly.
