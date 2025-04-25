---
title: "Security Context Constraints"
order: 30
description: "Configure and manage Security Context Constraints"
difficulty: "hard"
points: 15
hint: "scc-config-hint"
validationSteps:
  - "Verify SCC creation"
  - "Test pod deployment"
  - "Check permissions"
  - "Validate service account"
  - "Monitor security events"
---

### Security Context Constraints Configuration

**Task**: Configure SCCs with these requirements:

* Create custom SCC for running privileged containers
* Assign SCC to specific service account
* Configure pod to run with custom UID
* Allow mounting host paths
* Set SELinux context requirements

**Solution Steps**:
1. Create custom SCC:
```yaml
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  name: custom-privileged
allowPrivilegedContainer: true
allowHostDirVolumePlugin: true
runAsUser:
  type: MustRunAsRange
  uidRangeMin: 1000
  uidRangeMax: 2000
seLinuxContext:
  type: MustRunAs
supplementalGroups:
  type: MustRunAs
  ranges:
  - min: 1000
    max: 2000
users:
- system:serviceaccount:custom-ns:privileged-sa
volumes:
- hostPath
- configMap
- secret
```

2. Create service account:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: privileged-sa
  namespace: custom-ns
```

3. Create test pod using custom SCC:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: privileged-pod
  namespace: custom-ns
spec:
  serviceAccountName: privileged-sa
  containers:
  - name: privileged-container
    image: ubi8/ubi-minimal
    command: ["sleep", "infinity"]
    securityContext:
      runAsUser: 1500
      privileged: true
    volumeMounts:
    - name: host-vol
      mountPath: /host
  volumes:
  - name: host-vol
    hostPath:
      path: /var/log
```

**Verification**:
```bash
# Check SCC creation
oc get scc custom-privileged -o yaml

# Verify service account
oc describe sa privileged-sa -n custom-ns

# Test pod deployment
oc create -f privileged-pod.yaml
oc get pod privileged-pod -n custom-ns

# Check pod security context
oc get pod privileged-pod -n custom-ns -o yaml | grep -A 5 securityContext

# Monitor security events
oc get events -n custom-ns | grep SecurityContextConstraints
```

**Expected Results**:
- Custom SCC created successfully
- Service account properly configured
- Pod running with correct security context
- Host path mounted successfully
- SELinux context properly applied
