---
title: "Configuring Network Security"
order: 6
description: "Implement network policies and secure routes"
difficulty: "hard"
points: 20
hint: "network-security-hint"
validationSteps:
  - "Verify NetworkPolicy creation"
  - "Test pod connectivity"
  - "Validate route security"
  - "Check TLS configuration"
---

### Implementing Network Security

**Question**: Create a NetworkPolicy that allows traffic only from pods with label `role=frontend` to pods with label `role=backend` in the `prod` namespace, and secure the route with edge TLS termination.

**Answer**:

```yaml
# Create NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-to-backend
  namespace: prod
spec:
  podSelector:
    matchLabels:
      role: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: frontend
```

```bash
# Create secure route with edge termination
oc create route edge backend-route \
  --service=backend-service \
  --hostname=backend.apps.example.com \
  --cert=/path/to/cert.crt \
  --key=/path/to/key.key
```

- **Explanation**:
  - NetworkPolicy restricts access to backend pods
  - Only allows traffic from frontend pods
  - Route uses edge TLS termination
  - Secures external access to the service

**Additional Notes**:
- Test connectivity using temporary pods
- Verify TLS configuration with `openssl`
- Monitor network policy logs
- Backup TLS certificates
