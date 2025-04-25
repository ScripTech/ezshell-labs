---
title: "Scaling and High Availability"
order: 15
description: "Configure application scaling and high availability"
difficulty: "hard"
points: 20
hint: "scaling-ha-hint"
validationSteps:
  - "Verify HPA configuration"
  - "Test pod distribution"
  - "Check node affinity rules"
  - "Validate anti-affinity"
---

### Implementing High Availability

**Question**: Configure a deployment for high availability with the following requirements:
- Set up Horizontal Pod Autoscaling based on 70% CPU utilization (min 3, max 10 pods)
- Implement pod anti-affinity to ensure pods run on different nodes
- Configure topology spread constraints across zones
- Add readiness and liveness probes

**Answer**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ha-application
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ha-app
  template:
    metadata:
      labels:
        app: ha-app
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - ha-app
            topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfied: DoNotSchedule
        labelSelector:
          matchLabels:
            app: ha-app
      containers:
      - name: app
        image: nginx:latest
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ha-application-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ha-application
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Additional Notes**:
- Verify HPA configuration with `oc get hpa`
- Check pod distribution using `oc get pods -o wide`
- Monitor scaling events with `oc get events`
- Test failover by simulating node failures
- Verify probes using `oc describe pods`

**Validation Commands**:
```bash
# Check HPA status
oc get hpa ha-application-hpa

# Verify pod distribution
oc get pods -o wide | grep ha-app

# Monitor scaling events
oc get events --field-selector reason=Scaling

# Test pod distribution
oc get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName
```
