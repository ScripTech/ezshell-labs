---
title: "Install Roles Using Requirements File"
order: 6
description: "Install roles from URLs using requirements.yml"
difficulty: "medium"
points: 15
hint: "roles-requirements-hint"
validationSteps:
  - "Verify roles installation"
  - "Check roles directory"
  - "Validate requirements.yml"
---

### Installing Roles with requirements.yml

**Question**:
Create a `requirements.yml` file in `/home/admin/ansible` to install:
- Role `balancer` from `http://content.example.com/Rhce/balancer.tgz`
- Role `phpinfo` from `http://content.example.com/Rhce/phpinfo.tgz`
- Install roles to `/home/admin/ansible/roles`

**Answer**:

```yaml
# /home/admin/ansible/requirements.yml
roles:
  - name: balancer
    src: http://content.example.com/Rhce/balancer.tgz
  - name: phpinfo
    src: http://content.example.com/Rhce/phpinfo.tgz
```

```bash
ansible-galaxy role install -r requirements.yml -p roles/
ansible-galaxy list
```

**Validation Steps**:
1. Check roles directory: `ls ~/ansible/roles`
2. Verify requirements file: `cat ~/ansible/requirements.yml`
3. List installed roles: `ansible-galaxy list`
---
