---
title: "Generate Hosts File from Template"
order: 10
description: "Create /etc/myhosts using a Jinja2 template"
difficulty: "medium"
points: 15
hint: "hosts-template-hint"
validationSteps:
  - "Verify /etc/myhosts content"
  - "Check template rendering"
---

### Generating Hosts File

**Question**:
Download a template file from `http://materials.example.com/hosts.j2` to `/home/admin/ansible`.
Create a playbook `/home/admin/ansible/hosts.yml` to:
- Use the template to generate `/etc/myhosts` on hosts in the `dev` group.
- Each line should list IP, FQDN, and hostname for each managed host.

**Answer**:

```yaml
# /home/admin/ansible/hosts.yml
---
- hosts: dev
  gather_facts: true
  tasks:
    - template:
        src: hosts.j2
        dest: /etc/myhosts
```

**Validation Steps**:
1. Check file: `cat /etc/myhosts`
2. Verify IP and FQDN: `hostname -I; hostname -f`
---
