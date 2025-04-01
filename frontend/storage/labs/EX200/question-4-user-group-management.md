---
title: "User and Group Management"
order: 4
description: "Create users and groups with specific permissions"
difficulty: "medium"
points: 15
hint: "user-group-hint"
validationSteps:
  - "Verify group creation"
  - "Check user creation and group membership"
  - "Validate shell access restrictions"
  - "Test sudo permissions"
  - "Verify password settings"
---

### Creating Users, Groups, and Managing Permissions

Create the following users, groups, and group memberships:

1. Create a group named `sysadm`
2. Create a user `harry` who belongs to `sysadm` as a secondary group
3. Create a user `natasha` who belongs to `sysadm` as a secondary group
4. Create a user `sarah` who does not have access to an interactive shell & is not a member of `sysadm` group
5. Set the password for `harry`, `natasha`, and `sarah` to `password`
6. Grant the `sysadm` group access to add users in the server
7. Grant `harry` user access to set passwords for users without asking for sudo password
