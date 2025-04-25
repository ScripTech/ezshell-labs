---
title: "Service Mesh Implementation"
order: 28
description: "Deploy and configure Red Hat OpenShift Service Mesh"
difficulty: "expert"
points: 20
hint: "service-mesh-hint"
validationSteps:
  - "Verify operator installation"
  - "Check control plane deployment"
  - "Test service communication"
  - "Validate security policies"
  - "Monitor mesh metrics"
---

### Service Mesh Configuration

**Task**: Deploy and configure Service Mesh with these requirements:

* Install Service Mesh operators
* Deploy control plane in istio-system namespace
* Configure mTLS for all services
* Set up Kiali for visualization
* Implement traffic management policy

**Solution Steps**:
1. Create ServiceMeshControlPlane:
```yaml
apiVersion: maistra.io/v2
kind: ServiceMeshControlPlane
metadata:
  name: basic
  namespace: istio-system
spec:
  version: v2.3
  security:
    dataPlane:
      mtls: true
  tracing:
    type: Jaeger
    sampling: 10000
  policy:
    type: Istiod
  addons:
    grafana:
      enabled: true
    jaeger:
      install:
        storage:
          type: Memory
    kiali:
      enabled: true
    prometheus:
      enabled: true
```

2. Create ServiceMeshMemberRoll:
```yaml
apiVersion: maistra.io/v1
kind: ServiceMeshMemberRoll
metadata:
  name: default
  namespace: istio-system
spec:
  members:
    - bookinfo
    - applications
```

3. Configure VirtualService for traffic management:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ratings
  namespace: bookinfo
spec:
  hosts:
    - ratings
  http:
    - route:
        - destination:
            host: ratings
            subset: v1
          weight: 90
        - destination:
            host: ratings
            subset: v2
          weight: 10
```

**Verification**:
```bash
# Check control plane status
oc get smcp -n istio-system

# Verify member roll
oc get smmr -n istio-system

# Test mTLS enforcement
oc get peerauthentication -n istio-system

# Access Kiali dashboard
oc get route kiali -n istio-system

# Monitor mesh metrics
oc logs -f deploy/istiod -n istio-system
```

**Expected Results**:
- Service Mesh control plane running
- mTLS enabled and enforced
- Traffic management policies active
- Kiali showing service topology
- Metrics being collected and displayed
