# Configuring Storage Classes

**Question**: Configure a StorageClass for NFS dynamic provisioning.

**Answer**:  
1. **StorageClass**:  
   ```yaml
   apiVersion: storage.k8s.io/v1
   kind: StorageClass
   metadata:
     name: nfs-storage
   provisioner: example.com/nfs
   parameters:
     server: nfs-server.example.com
     path: /exported/path
   ```  
2. **PVC**:  
   ```yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: my-pvc
   spec:
     storageClassName: nfs-storage
     accessModes:
       - ReadWriteMany
     resources:
       requests:
         storage: 10Gi
   ```

**Additional Notes**:  
- Install NFS provisioner if needed.  
- Verify with `oc get pvc`.
