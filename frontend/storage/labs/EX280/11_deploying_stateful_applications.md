# Deploying Stateful Applications

**Question**: Deploy a stateful application with a StatefulSet in OpenShift, ensuring persistent storage.

**Answer**:  
1. **StatefulSet**:  
   ```yaml
   apiVersion: apps/v1
   kind: StatefulSet
   metadata:
     name: stateful-app
   spec:
     replicas: 3
     serviceName: "stateful-service"
     template:
       spec:
         containers:
         - name: app
           image: my-stateful-image
           volumeMounts:
           - name: data
             mountPath: /data
     volumeClaimTemplates:
     - metadata:
         name: data
       spec:
         accessModes: ["ReadWriteOnce"]
         resources:
           requests:
             storage: 1Gi
   ```  
2. **Apply**:  
   ```bash
   oc apply -f statefulset.yaml
   ```

**Additional Notes**:  
- Each pod gets a unique PVC.  
- Suitable for databases.
