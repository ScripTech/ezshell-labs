---
title: "Use RHEL System Role: Timesync"
order: 5
description: "Configure NTP using timesync system role"
difficulty: "medium"
points: 15
hint: "timesync-role-hint"
validationSteps:
  - "Verify timesync configuration"
  - "Check NTP server settings"
  - "Validate iburst parameter"
  - "Test time synchronization"
---

### Using RHEL System Role for Timesync

**Question**:
Install the `rhel-system-roles` package and create a playbook `/home/admin/ansible/timesync.yml` to:
- Run on all managed nodes
- Use the `timesync` role
- Configure the role to use the currently active NTP provider
- Set the time server to `172.25.254.254` or `Classroom.example.com`
- Enable the `iburst` parameter

**Answer**:

```bash
# Install system roles
sudo dnf install rhel-system-roles -y

# Example playbook
cat << EOF > /home/admin/ansible/timesync.yml
---
- hosts: all
  vars:
    timesync_ntp_servers:
      - hostname: Classroom.example.com
        iburst: true
  roles:
    - rhel_system_roles.timesync
EOF

# Run playbook
ansible-navigator run timesync.yml -m stdout
```

**Validation Steps**:
1. Check NTP server in `/etc/chrony.conf`
2. Verify iburst parameter: `cat /etc/chrony.conf | grep iburst`
3. Test time sync: `chronyc sources -v`
---
