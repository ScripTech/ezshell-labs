---
title: "Managing Service Accounts"
order: 17
description: "Create and configure service accounts for automation"
difficulty: "medium"
points: 10
hint: "service-account-hint"
validationSteps:
  - "Verify account creation"
  - "Check role bindings"
  - "Test token authentication"
  - "Validate permissions"
  - "Monitor service account usage"
---

### Managing Service Accounts

**Question**: Create a service account, assign it to a pod, and use its token for API access.

**Answer**:
1. **Create**:
   ```bash
   oc create serviceaccount my-sa --namespace=my-namespace
   ```
2. **Assign**:
   ```yaml
   apiVersion: v1
   kind: Pod
   spec:
     serviceAccountName: my-sa
     containers:
     - name: my-container
       image: nginx
   ```
3. **Use Token**:
   - Token at `/var/run/secrets/kubernetes.io/serviceaccount/token`.
   ```bash
   curl -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" https://kubernetes.default.svc/api
   ```

**Additional Notes**:
- View with `oc describe serviceaccount`.
- Restrict with RBAC.
