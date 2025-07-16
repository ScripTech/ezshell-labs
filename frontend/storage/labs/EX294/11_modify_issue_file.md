---
title: "Modify /etc/issue File"
order: 11
description: "Set custom content in /etc/issue based on host group"
difficulty: "medium"
points: 10
hint: "issue-file-hint"
validationSteps:
  - "Verify /etc/issue content"
  - "Check correct text per host group"
---

### Modifying /etc/issue Content

**Question**:
Create a playbook `/home/admin/ansible/issue.yml` to:
- On hosts in the dev group, set `/etc/issue` to "Development"
- On hosts in the test group, set `/etc/issue` to "Test"
- On hosts in the prod group, set `/etc/issue` to "Production"

**Answer**:

```yaml
# /home/admin/ansible/issue.yml
---
- name: Modify /etc/issue content on managed hosts
  hosts: all
  tasks:
    - name: Set /etc/issue content to "Development" on dev hosts
      copy:
        dest: /etc/issue
        content: "Development\n"
      when: inventory_hostname in groups['dev']

    - name: Set /etc/issue content to "Test" on test hosts
      copy:
        dest: /etc/issue
        content: "Test\n"
      when: inventory_hostname in groups['test']

    - name: Set /etc/issue content to "Production" on prod hosts
      copy:
        dest: /etc/issue
        content: "Production\n"
      when: inventory_hostname in groups['prod']
```

**Validation Steps**:
1. Check file: `cat /etc/issue`
2. Confirm correct text per host group
---
