---
title: "File Permissions Configuration"
order: 9
description: "Set up complex file permissions including ACLs"
difficulty: "medium"
points: 12
hint: "file-permissions-hint"
validationSteps:
  - "Check basic permissions"
  - "Verify ACL configuration"
  - "Test user access"
  - "Validate group permissions"
  - "Check default ACLs"
---

### Configuring File Permissions

* Copy the file `/etc/fstab` to `/var/tmp`
* Configure the permissions of `/var/tmp/fstab` as follows:
  - Owned by the root user
  - Belongs to the root group
  - Not executable by anyone
  - User "natasha" can read and write
  - User "harry" cannot read or write
  - All other users (current or future) can read

#### Expected Result
- Correct ownership and basic permissions
- ACLs properly configured
- New files inherit permissions
