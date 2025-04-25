---
title: "Configuring Multi-Container Pods"
order: 10
description: "Deploy and manage multi-container pods"
difficulty: "medium"
points: 20
hint: "multicontainer-pod-hint"
validationSteps:
  - "Verify pod creation"
  - "Check container communication"
  - "Validate shared resources"
  - "Test pod functionality"
---

### Deploying Multi-Container Pods

**Question**: Create a multi-container pod with a main application container running nginx and a sidecar container running fluentd for logging. The containers should share a volume mounted at `/var/log/nginx` for log collection.

**Answer**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-with-sidecar
spec:
  containers:
  - name: nginx
    image: nginx:latest
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/nginx
  - name: fluentd
    image: fluentd:latest
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/nginx
      readOnly: true
  volumes:
  - name: log-volume
    emptyDir: {}
```

**Additional Notes**:
- Check container logs using `oc logs`
- Verify volume mounting with `oc describe pod`
- Monitor container health
- Test log collection functionality
