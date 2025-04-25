---
title: "Managing Persistent Storage"
order: 3
description: "Configure persistent storage for applications"
difficulty: "medium"
points: 20
hint: "storage-config-hint"
validationSteps:
  - "Verify PVC creation"
  - "Check storage class"
  - "Validate volume mounting"
  - "Test storage persistence"
---

### Configuring Persistent Storage

**Question**: Create a PersistentVolumeClaim named `mysql-data` with 5Gi storage using the `managed-premium` StorageClass, and mount it to a MySQL deployment at `/var/lib/mysql`.

**Answer**:
```bash
# Create PVC
cat << EOF | oc create -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: managed-premium
EOF

# Create MySQL deployment with PVC
oc new-app mysql:5.7 --name=mysql \
  -e MYSQL_ROOT_PASSWORD=mypassword
oc set volume deployment/mysql --add --name=mysql-storage \
  --type=persistentVolumeClaim --claim-name=mysql-data \
  --mount-path=/var/lib/mysql
```

**Explanation**:
- Creates PVC with specified size and storage class
- Deploys MySQL database
- Mounts PVC to correct path
- Ensures data persistence

---
