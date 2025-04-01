# Horizontal Scaling

**Question**: Scale a Deployment named "web-app" from 2 to 5 replicas in OpenShift.

**Answer**:  
1. **Scale**:  
   ```bash
   oc scale deployment/web-app --replicas=5 --namespace=<namespace>
   ```  
2. **Verify**:  
   ```bash
   oc get pods --namespace=<namespace>
   ```

**Additional Notes**:  
- Check resource availability.  
- Use HPA for auto-scaling.
