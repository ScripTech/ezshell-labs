---
title: "Configuring Advanced Routes"
order: 11
description: "Set up advanced routing configurations"
difficulty: "hard"
points: 20
hint: "advanced-routing-hint"
validationSteps:
  - "Verify route creation"
  - "Test traffic distribution"
  - "Validate SSL settings"
  - "Check route status"
---

### Implementing Advanced Routes

**Question**: Create a route with weighted routing that splits traffic between two services: 'app-v1' (60%) and 'app-v2' (40%). Configure edge termination with a custom certificate and enable sticky sessions.

**Answer**:

````yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: split-route
  annotations:
    haproxy.router.openshift.io/balance: roundrobin
    haproxy.router.openshift.io/disable_cookies: 'false'
spec:
  host: myapp.apps.example.com
  tls:
    termination: edge
    certificate: |
      -----BEGIN CERTIFICATE-----
      Your-Certificate-Here
      -----END CERTIFICATE-----
    key: |
      -----BEGIN PRIVATE KEY-----
      Your-Private-Key-Here
      -----END PRIVATE KEY-----
  alternateBackends:
  - kind: Service
    name: app-v2
    weight: 40
  to:
    kind: Service
    name: app-v1
    weight: 60
