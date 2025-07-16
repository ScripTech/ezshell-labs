---
title: "Create Web Content Directory"
order: 12
description: "Create and configure webdev and opsmgr directories"
difficulty: "medium"
points: 15
hint: "web-content-dir-hint"
validationSteps:
  - "Verify directory creation"
  - "Check permissions and group"
  - "Validate symbolic link"
  - "Test web page output"
---

### Creating Web Content Directory

**Question**:
Create a playbook `/home/admin/ansible/webcontent.yml` to:
- On dev hosts:
  - Ensure group `webdev` exists
  - Create `/webdev` directory with owner=root, group=webdev, mode=2775 (setgid)
  - Create symbolic link `/var/www/html/webdev` to `/webdev`
  - Create `/webdev/index.html` with content "Development"
- On test hosts:
  - Ensure group `opsmgr` exists
  - Create `/opsmgr` directory with owner=root, group=opsmgr, mode=2775 (setgid)

**Answer**:

```yaml
# /home/admin/ansible/webcontent.yml
---
- name: Create web content directory on dev hosts
  hosts: dev
  tasks:
    - name: Ensure group 'webdev' exists
      group:
        name: webdev
        state: present

    - name: Create /webdev directory with setgid and proper permissions
      file:
        path: /webdev
        state: directory
        owner: root
        group: webdev
        mode: "2775"

    - name: Create symbolic link from /var/www/html/webdev to /webdev
      file:
        src: /webdev
        dest: /var/www/html/webdev
        state: link
        force: true

    - name: Create /webdev/index.html with content "Development"
      copy:
        dest: /webdev/index.html
        content: "Development\n"
        owner: root
        group: webdev
        mode: 0644

- hosts: test
  tasks:
    - name: Ensure group 'opsmgr' exists
      group:
        name: opsmgr
        state: present

    - name: Create /opsmgr directory with setgid and proper permissions
      file:
        path: /opsmgr
        state: directory
        owner: root
        group: opsmgr
        mode: "2775"
```

**Validation Steps**:
1. Check directory and permissions: `ls -ld /webdev /opsmgr`
2. Check symbolic link: `ls -l /var/www/html/webdev`
3. Test web page: `curl http://<dev-host>/webdev/`
---
