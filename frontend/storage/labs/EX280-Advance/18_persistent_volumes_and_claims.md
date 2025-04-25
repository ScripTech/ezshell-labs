---
title: "Persistent Volumes and Claims"
order: 18
description: "Configure persistent storage for applications"
difficulty: "hard"
points: 15
hint: "pv-pvc-hint"
validationSteps:
  - "Check PV creation"
  - "Verify PVC binding"
  - "Test storage access"
  - "Validate persistence"
  - "Monitor storage usage"
---

### Persistent Volumes and Claims

**Question**: Create a PV and PVC, and use the PVC in a pod.

**Answer**:
1. **PV**:
   ```yaml
   apiVersion: v1
   kind: PersistentVolume
   metadata:
     name: my-pv
   spec:
     capacity:
       storage: 5Gi
     accessModes:
       - ReadWriteOnce
     hostPath:
       path: /mnt/data
   ```
2. **PVC**:
   ```yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: my-pvc
   spec:
     accessModes:
       - ReadWriteOnce
     resources:
       requests:
         storage: 5Gi
   ```
3. **Pod**:
   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: my-pod
   spec:
     containers:
     - name: my-container
       image: nginx
       volumeMounts:
       - mountPath: /data
         name: my-volume
     volumes:
     - name: my-volume
       persistentVolumeClaim:
         claimName: my-pvc
   ```

**Additional Notes**:
- Apply with `oc apply`.
- Use dynamic provisioning for scalability.
