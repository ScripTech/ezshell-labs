# Blue-Green Deployments

**Question**: Implement a blue-green deployment in OpenShift and switch traffic from "blue" to "green".

**Answer**:  
1. **Deploy**:  
   - Blue: `deployment/blue-app`.  
   - Green: `deployment/green-app`.  
2. **Route**:  
   - Start with blue:  
     ```bash
     oc expose service blue-service --name=my-route
     ```  
   - Switch to green:  
     ```bash
     oc patch route/my-route -p '{"spec":{"to":{"name":"green-service"}}}'
     ```

**Additional Notes**:  
- Roll back by reverting the route.  
- Validate "green" before switching.
