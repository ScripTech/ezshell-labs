---
title: "Cluster Quota Management"
order: 24
description: "Implement and manage cluster-wide resource quotas"
difficulty: "medium"
points: 12
hint: "quota-management-hint"
validationSteps:
  - "Verify quota creation"
  - "Test limit enforcement"
  - "Check usage statistics"
  - "Validate multi-project quotas"
  - "Monitor resource consumption"
---

### Cluster Resource Quota Configuration

**Task**: Configure cluster resource quotas with these requirements:

* Limit total CPU across all dev namespaces to 8 cores
* Limit total memory to 16Gi
* Set per-namespace limits for pods (max 10)
* Configure default resource limits
* Apply quotas to namespaces with label: environment=development

**Solution Steps**:
1. Create ClusterResourceQuota:
```yaml
apiVersion: quota.openshift.io/v1
kind: ClusterResourceQuota
metadata:
  name: dev-quota
spec:
  selector:
    labels:
      environment: development
  quota:
    hard:
      cpu: "8"
      memory: 16Gi
      pods: "10"
```

2. Configure LimitRange:
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: dev-limits
spec:
  limits:
  - type: Container
    default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 100m
      memory: 256Mi
```

**Verification**:
```bash
# Check quota status
oc describe clusterresourcequota dev-quota

# Test quota enforcement
oc create deployment test --image=nginx --replicas=15

# Monitor usage
oc get clusterresourcequota dev-quota -o jsonpath='{.status.total.hard}'
```
