---
title: "Private Registry Configuration"
order: 27
description: "Set up and configure private image registry"
difficulty: "hard"
points: 15
hint: "registry-config-hint"
validationSteps:
  - "Verify registry deployment"
  - "Test image push/pull"
  - "Check storage configuration"
  - "Validate authentication"
  - "Monitor registry metrics"
---

### Private Registry Setup

**Task**: Configure OpenShift's internal registry with these requirements:

* Enable registry with persistent storage
* Configure S3 storage backend
* Set up authentication for external access
* Configure image pruning policy
* Enable registry metrics collection

**Solution Steps**:
1. Configure registry operator:
```yaml
apiVersion: imageregistry.operator.openshift.io/v1
kind: Config
metadata:
  name: cluster
spec:
  managementState: Managed
  storage:
    s3:
      bucket: openshift-registry
      region: us-east-1
      encrypt: true
      secretKey:
        name: registry-s3-credentials
      keyID: AKIAIOSFODNN7EXAMPLE
  replicas: 2
  defaultRoute: true
  logging: 2
  rolloutStrategy: Recreate
```

2. Create authentication secret:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-auth
  namespace: openshift-image-registry
type: kubernetes.io/dockerconfigjson
stringData:
  .dockerconfigjson: |
    {
      "auths": {
        "registry.example.com:5000": {
          "username": "registry",
          "password": "strongpassword",
          "email": "admin@example.com"
        }
      }
    }
```

3. Configure image pruning:
```yaml
apiVersion: imageregistry.operator.openshift.io/v1
kind: ImagePruner
metadata:
  name: cluster
spec:
  schedule: "0 0 * * *"
  suspend: false
  keepTagRevisions: 3
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
```

**Verification**:
```bash
# Check registry status
oc get configs.imageregistry.operator.openshift.io/cluster -o yaml

# Test registry access
podman login -u kubeadmin -p $(oc whoami -t) registry.example.com:5000

# Push test image
podman push myapp:latest registry.example.com:5000/myproject/myapp:latest

# Verify storage
oc get pvc -n openshift-image-registry

# Check pruner status
oc get imagepruner cluster -o yaml
```

**Expected Results**:
- Registry running with S3 storage
- External access working
- Images successfully pushed/pulled
- Pruning policy active
- Metrics being collected
