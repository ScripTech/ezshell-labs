---
title: "Managing OpenShift Platform Resources"
order: 5
description: "Configure cluster resource quotas and limits"
difficulty: "hard"
points: 20
hint: "cluster-resources-hint"
validationSteps:
  - "Verify ClusterResourceQuota creation"
  - "Check quota configuration"
  - "Validate project annotations"
  - "Test quota enforcement"
---

### Managing Cluster Resource Quotas

**Question**: Create a ClusterResourceQuota that limits the total number of pods across all projects labeled with `environment=production` to 50 pods, and set CPU requests to maximum 20 cores.

**Answer**:
```bash
cat << EOF | oc create -f -
apiVersion: quota.openshift.io/v1
kind: ClusterResourceQuota
metadata:
  name: prod-quota
spec:
  selector:
    annotations:
      openshift.io/requester: ${USER}
    labels:
      matchLabels:
        environment: production
  quota:
    hard:
      pods: "50"
      requests.cpu: "20"
EOF
```

**Explanation**:
- Creates a cluster-wide quota for production environments
- Applies to projects with specific labels
- Limits total pod count and CPU requests
- Uses annotation matching for project selection
