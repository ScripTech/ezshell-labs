# Troubleshooting Network Connectivity

**Question**: Troubleshoot pod communication issues across namespaces in OpenShift.

**Answer**:  
1. **Check Pods**: `oc get pods --all-namespaces`.  
2. **Verify Services**: `oc describe service <service>`.  
3. **Inspect Policies**: `oc get networkpolicy`.  
4. **Test**: Use `oc debug pod/<pod>` with `ping` or `curl`.  
5. **Resolve**: Adjust policies or selectors.

**Additional Notes**:  
- Check DNS with `oc get dns`.  
- Review logs with `oc logs`.
