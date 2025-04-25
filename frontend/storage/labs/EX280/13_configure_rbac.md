---
title: "Configuring RBAC"
order: 13
description: "Implement Role-Based Access Control"
difficulty: "hard"
points: 20
hint: "rbac-configuration-hint"
validationSteps:
  - "Verify role creation"
  - "Test user permissions"
  - "Validate access controls"
  - "Check audit logs"
---

### Implementing RBAC

**Question**: Create a custom Role that allows users to manage pods and deployments (create, update, delete) but not secrets or configmaps in the 'app-prod' namespace. Create a RoleBinding to assign this role to the 'dev-team' group.

**Answer**:

```yaml
# Create custom Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-deployment-manager
  namespace: app-prod
rules:
- apiGroups: ["apps", ""]
  resources: ["pods", "deployments"]
  verbs: ["create", "update", "delete", "get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-team-pod-deployment
  namespace: app-prod
subjects:
- kind: Group
  name: dev-team
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-deployment-manager
  apiGroup: rbac.authorization.k8s.io
```

**Additional Notes**:
- Verify permissions with `oc auth can-i`
- Test access with different users
- Review audit logs for access attempts
