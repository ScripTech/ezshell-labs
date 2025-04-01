# Rolling Update Deployment

**Question**: Deploy an application with a rolling update strategy for zero downtime using `oc`. Use a Deployment named "my-app" in "production".

**Answer**:  
1. **Update**:  
   ```bash
   oc set image deployment/my-app my-container=new-image:v2 --namespace=production
   ```  
2. **Monitor**:  
   ```bash
   oc rollout status deployment/my-app --namespace=production
   ```

**Additional Notes**:  
- Revert with `oc rollout undo`.  
- Tune with `maxUnavailable` and `maxSurge`.
