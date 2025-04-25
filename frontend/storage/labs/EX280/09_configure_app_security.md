---
title: "Configuring Application Security"
order: 9
description: "Implement security context constraints and service accounts"
difficulty: "hard"
points: 20
hint: "security-context-hint"
validationSteps:
  - "Verify SCC creation"
  - "Check service account permissions"
  - "Validate pod security"
  - "Test application access"
---

### Implementing Security Controls

**Question**: Create a custom SecurityContextConstraints (SCC) named `restricted-custom` that allows running containers with a specific user ID (1000), create a service account named `custom-sa`, and bind the SCC to it.

**Answer**:

```yaml
# Create custom SCC
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  name: restricted-custom
allowPrivilegeEscalation: false
runAsUser:
  type: MustRunAs
  uid: 1000
seLinuxContext:
  type: MustRunAs
users: []
groups: []
```

```bash
# Create service account and bind SCC
oc create sa custom-sa
oc adm policy add-scc-to-user restricted-custom -z custom-sa
```

**Additional Notes**:
- Verify SCC creation with `oc get scc`
- Test pod deployment using the service account
- Monitor security policy violations
- Document security configurations
