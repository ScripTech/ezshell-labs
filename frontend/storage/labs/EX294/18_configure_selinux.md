---
title: "Configure SELinux"
order: 18
description: "Set SELinux mode to enforcing using system roles"
difficulty: "easy"
points: 10
hint: "selinux-hint"
validationSteps:
  - "Verify SELinux enforcing mode"
  - "Check SELinux status"
---

### Configuring SELinux

**Question**:
Create a playbook `/home/admin/ansible/selinux.yml` to:
- Set SELinux mode to enforcing on all managed nodes
- Use the `redhat.rhel_system_roles.selinux` role

**Answer**:

```yaml
# /home/admin/ansible/selinux.yml
---
- name: Configure SELinux as enforcing mode
  hosts: all
  become: true
  vars:
    selinux_state: enforcing
  roles:
    - redhat.rhel_system_roles.selinux
```

**Validation Steps**:
1. Check SELinux status: `getenforce`
2. Verify SELinux config: `cat /etc/selinux/config`
---
