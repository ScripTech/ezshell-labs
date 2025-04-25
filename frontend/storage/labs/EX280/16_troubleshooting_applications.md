---
title: "Troubleshooting OpenShift Applications"
order: 16
description: "Debug and resolve common application issues"
difficulty: "hard"
points: 25
hint: "troubleshooting-hint"
validationSteps:
  - "Check application logs"
  - "Verify pod status"
  - "Validate network connectivity"
  - "Review resource constraints"
  - "Test service endpoints"
---

### Troubleshooting Application Deployment Issues

**Question**: You have a failing application deployment in the 'app-prod' namespace. Perform the following troubleshooting tasks:
1. Identify why pods are failing to start (CrashLoopBackOff state)
2. Fix the application's persistent volume claim issues
3. Resolve service connectivity problems
4. Debug and fix the ImagePullBackOff error
5. Export application logs for analysis

**Answer**:

```bash
# 1. Investigate pod status and logs
oc get pods -n app-prod
oc describe pod <pod-name> -n app-prod
oc logs <pod-name> -n app-prod
oc logs <pod-name> -n app-prod --previous

# 2. Check PVC status and fix storage
oc get pvc -n app-prod
oc get pv
oc describe pvc <pvc-name> -n app-prod
oc patch pvc <pvc-name> -n app-prod --patch '{"spec":{"resources":{"requests":{"storage":"5Gi"}}}}'

# 3. Debug service connectivity
oc get svc -n app-prod
oc get endpoints -n app-prod
oc debug deployment/<deployment-name> -n app-prod -- curl -v service-name:port

# 4. Fix image pull issues
oc get imagestreamtag -n app-prod
oc set image deployment/<deployment-name> container-name=new-image:tag -n app-prod
oc patch serviceaccount default -p '{"imagePullSecrets": [{"name": "myregistrykey"}]}'

# 5. Export logs for analysis
oc adm must-gather --dest-dir=./trouble-logs
oc logs deployment/<deployment-name> -n app-prod > app-logs.txt
```

**Common Issues and Solutions**:
```yaml
# Fix resource constraints
apiVersion: v1
kind: LimitRange
metadata:
  name: resource-constraints
  namespace: app-prod
spec:
  limits:
  - type: Container
    default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 200m
      memory: 256Mi
```

**Additional Notes**:
- Use `oc get events -n app-prod` to track recent cluster events
- Check node status with `oc get nodes` and `oc describe node`
- Verify network policies with `oc get networkpolicy`
- Review security context constraints using `oc get scc`
- Use `oc debug node/<node-name>` for node-level troubleshooting

**Validation Steps**:
1. Confirm pods are running: `oc get pods -n app-prod -w`
2. Verify PVC binding: `oc get pvc -n app-prod`
3. Test service connectivity: `oc rsh <pod-name> curl service-name:port`
4. Check image pull status: `oc describe pod <pod-name> | grep -A 5 Events`
5. Verify logs are collected: `ls -l ./trouble-logs`

This comprehensive troubleshooting question adds significant value as it:
- Tests multiple exam objectives
- Covers real-world scenarios
- Requires deep understanding of OpenShift components
- Demonstrates debugging methodology
- Worth 25 points to help secure a high passing score
