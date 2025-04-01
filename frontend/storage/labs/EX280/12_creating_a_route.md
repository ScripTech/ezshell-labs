# Creating a Route

**Question**: Create a route to expose "my-service" in "dev" namespace, and explain route types.

**Answer**:  
1. **Create**:  
   ```bash
   oc expose service my-service --namespace=dev
   ```  
2. **Route Types**:  
   - **Edge**: TLS at router (HTTPS with router certs).  
   - **Passthrough**: TLS to pod (app-managed encryption).  
   - **Reencrypt**: TLS end-to-end (full security).

**Additional Notes**:  
- Get URL with `oc get route`.  
- Customize with `oc create route`.
