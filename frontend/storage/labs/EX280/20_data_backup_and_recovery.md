# Data Backup and Recovery

**Question**: Implement backup and recovery for persistent volumes in OpenShift.

**Answer**:  
1. **Tool**: Velero  
   - Install Velero and configure S3 storage.  
2. **Backup**:  
   ```bash
   velero backup create my-backup --include-namespaces=my-namespace
   ```  
3. **Recovery**:  
   ```bash
   velero restore create --from-backup my-backup
   ```

**Additional Notes**:  
- Schedule with `velero schedule create`.  
- Test restores periodically.
