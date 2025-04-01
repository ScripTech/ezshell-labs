# Implementing Network Policies

**Question**: Restrict traffic to allow only "frontend" namespace pods to access "backend" namespace pods.

**Answer**:  
1. **Policy**:  
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: allow-frontend-to-backend
     namespace: backend
   spec:
     podSelector: {}
     ingress:
     - from:
       - namespaceSelector:
           matchLabels:
             kubernetes.io/metadata.name: frontend
   ```  
2. **Apply**:  
   ```bash
   oc apply -f networkpolicy.yaml
   ```

**Additional Notes**:  
- Label namespaces correctly.  
- Test with `oc debug`.
