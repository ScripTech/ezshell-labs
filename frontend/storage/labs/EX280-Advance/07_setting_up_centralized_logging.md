---
title: "Setting Up Centralized Logging"
order: 7
description: "Configure cluster-wide logging and log aggregation"
difficulty: "hard"
points: 15
hint: "logging-setup-hint"
validationSteps:
  - "Verify operator installation"
  - "Check Elasticsearch deployment"
  - "Test log collection"
  - "Validate Kibana access"
  - "Check log retention"
---

### Setting Up Centralized Logging

**Question**: How do you set up centralized logging in OpenShift, including log aggregation and retention?

**Answer**:
1. **Setup**:
   - Install Cluster Logging Operator.
   - Deploy:
     ```yaml
     apiVersion: logging.openshift.io/v1
     kind: ClusterLogging
     metadata:
       name: instance
       namespace: openshift-logging
     spec:
       logStore:
         type: elasticsearch
         retentionPolicy:
           application:
             maxAge: 30d
     ```
2. **Aggregation**:
   - Fluentd collects logs to Elasticsearch.
3. **Access**:
   - Use Kibana for log queries.

**Additional Notes**:
- Secure Kibana with RBAC.
- Adjust retention per storage needs.
