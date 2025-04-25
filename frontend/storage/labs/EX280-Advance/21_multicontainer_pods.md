---
title: "Configure Multi-Container Pods"
order: 21
description: "Create and manage multi-container pods with shared resources"
difficulty: "hard"
points: 15
hint: "multicontainer-hint"
validationSteps:
  - "Verify pod creation"
  - "Check container communication"
  - "Test volume sharing"
  - "Validate init containers"
  - "Monitor resource usage"
---

### Multi-Container Pod Configuration

**Task**: Create a multi-container pod with the following requirements:

* Main container running `httpd:2.4`
* Sidecar container running `fluentd:v1.14` for log collection
* Shared volume mounted at `/var/log/httpd` in both containers
* Init container that runs `busybox` to create initial log files
* Resource limits: 512Mi memory, 0.5 CPU for each container

**Solution Steps**:
1. Create the pod configuration:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-logging
  namespace: multi-container-demo
spec:
  initContainers:
  - name: init-logs
    image: busybox
    command: ['sh', '-c', 'touch /var/log/httpd/access.log']
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/httpd
  containers:
  - name: web
    image: httpd:2.4
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/httpd
  - name: log-collector
    image: fluentd:v1.14
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/httpd
  volumes:
  - name: log-volume
    emptyDir: {}
```

**Verification**:
```bash
# Check pod status
oc get pod web-logging -n multi-container-demo

# Verify log sharing
oc exec web-logging -c web -- tail /var/log/httpd/access.log
oc exec web-logging -c log-collector -- tail /var/log/httpd/access.log

# Monitor resource usage
oc adm top pod web-logging -n multi-container-demo --containers
```
