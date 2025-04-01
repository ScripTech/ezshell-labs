# Implementing RBAC

**Question**: Create a custom role for "dev-user" to manage pods in a namespace.

**Answer**:  
1. **Role**:  
   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: Role
   metadata:
     name: pod-manager
     namespace: dev
   rules:
   - apiGroups: [""]
     resources: ["pods"]
     verbs: ["get", "list", "create", "delete"]
   ```  
   ```bash
   oc apply -f role.yaml
   ```  
2. **Bind**:  
   ```bash
   oc create rolebinding dev-user-pod-manager --role=pod-manager --user=dev-user --namespace=dev
   ```

**Additional Notes**:  
- Test with `oc auth can-i`.  
- Use ClusterRoles for broader access.
