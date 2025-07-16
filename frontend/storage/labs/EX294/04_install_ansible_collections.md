---
title: "Install Ansible Content Collections"
order: 4
description: "Install required Ansible collections from provided URLs"
difficulty: "medium"
points: 15
hint: "collections-install-hint"
validationSteps:
  - "Verify collection installation"
  - "Check collections path"
  - "Validate ansible.cfg update"
---

### Installing Ansible Collections

**Question**:
Install the following Ansible collections on the control node:
- `ansible-posix-1.4.0.tar.gz` from `http://content.example.com/materials/ansible-posix-1.4.0.tar.gz`
- `redhat-rhel_system_roles-1.0.0.tar.gz` from `http://content/Rhce/redhat-rhel_system_roles-1.0.0.tar.gz`
- Install them under `/home/admin/ansible/collections`
- Update `ansible.cfg` to include the new collections path

**Answer**:

```bash
# cd ~/ansible/collections
ansible-galaxy collection install http://content.example.com/materials/ansible-posix-1.4.0.tar.gz -p .
ansible-galaxy collection install http://content/Rhce/redhat-rhel_system_roles-1.0.0.tar.gz -p .

# Update ansible.cfg
echo 'collections_paths = ./collections:/usr/share/ansible/collections' >> /home/admin/.ansible.cfg

# Verify installation
ansible-navigator collections
```

**Validation Steps**:
1. Check collections directory: `ls ~/ansible/collections`
2. Verify ansible.cfg: `cat /home/admin/.ansible.cfg | grep collections_paths`
3. List installed collections: `ansible-galaxy collection list`
---
