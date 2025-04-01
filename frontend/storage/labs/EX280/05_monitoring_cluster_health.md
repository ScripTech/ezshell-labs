# Monitoring Cluster Health

**Question**: How do you monitor OpenShift cluster health? Specify tools and metrics for identifying issues like resource exhaustion.

**Answer**:  
- **Tools**:  
  - OpenShift Console, Prometheus, Grafana, Alertmanager.  
- **Metrics**:  
  - CPU/memory usage (`oc adm top nodes`).  
  - Pod status (`oc get pods`).  
  - Node health (`oc get nodes`).  
  - Etcd latency.  

**Additional Notes**:  
- Set custom alerts in Alertmanager.  
- Review logs and metrics regularly.
