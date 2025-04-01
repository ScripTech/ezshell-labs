---
title: "Nexus Private Registry Configuration"
order: 31
description: "Set up and configure Nexus as private container registry"
difficulty: "hard"
points: 15
hint: "nexus-registry-hint"
validationSteps:
  - "Verify Nexus deployment"
  - "Test registry configuration"
  - "Check authentication"
  - "Validate image push/pull"
  - "Monitor storage usage"
---

### Nexus Private Registry Setup

**Task**: Deploy and configure Nexus as a private registry with these requirements:

* Deploy Nexus with persistent storage
* Configure Docker registry hosted repository
* Set up authentication and SSL
* Configure OpenShift to use private registry
* Implement registry mirroring

**Solution Steps**:
1. Deploy Nexus:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nexus
  namespace: nexus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nexus
  template:
    metadata:
      labels:
        app: nexus
    spec:
      containers:
      - name: nexus
        image: sonatype/nexus3:latest
        ports:
        - containerPort: 8081
        - containerPort: 5000
        volumeMounts:
        - name: nexus-data
          mountPath: /nexus-data
        resources:
          limits:
            memory: 4Gi
            cpu: "2"
          requests:
            memory: 2Gi
            cpu: "1"
      volumes:
      - name: nexus-data
        persistentVolumeClaim:
          claimName: nexus-pvc
```

2. Configure registry in Nexus:
```bash
#!/bin/bash
# Create Docker hosted repository
curl -X POST \
  -u admin:admin123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "docker-private",
    "online": true,
    "storage": {
      "blobStoreName": "default",
      "strictContentTypeValidation": true
    },
    "docker": {
      "v1Enabled": false,
      "forceBasicAuth": true,
      "httpPort": 5000
    }
  }' \
  http://nexus.example.com/service/rest/v1/repositories/docker/hosted
```

3. Configure OpenShift registry mirror:
```yaml
apiVersion: config.openshift.io/v1
kind: ImageRegistry
metadata:
  name: cluster
spec:
  registrySources:
    insecureRegistries:
    - nexus.example.com:5000
    allowedRegistries:
    - nexus.example.com:5000
    - registry.redhat.io
    registryMirrors:
    - source: registry.redhat.io
      mirror: nexus.example.com:5000/mirror
```

**Verification**:
```bash
# Test registry access
podman login nexus.example.com:5000

# Push test image
podman push myapp:latest nexus.example.com:5000/myapp:latest

# Verify in OpenShift
oc import-image myapp:latest --from=nexus.example.com:5000/myapp:latest --confirm

# Check storage
oc exec deploy/nexus -- du -sh /nexus-data
```

**Expected Results**:
- Nexus running with Docker registry
- Authentication working
- Images successfully pushed/pulled
- Registry mirroring active
- Storage properly configured
