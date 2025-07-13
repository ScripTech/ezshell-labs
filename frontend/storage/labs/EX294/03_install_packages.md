---
title: "Install and Update Packages"
order: 3
description: "Install PHP, MariaDB, and RPM Development Tools"
difficulty: "medium"
points: 15
hint: "package-install-hint"
validationSteps:
  - "Verify package installation"
  - "Check package group installation"
  - "Validate updates"
---

### Installing and Updating Packages

**Question**:
Create a playbook to:
- Install PHP and MariaDB on hosts in the dev, test, and prod groups
- Install RPM Development Tools package group on dev hosts
- Update all packages to the latest version on dev hosts

**Answer**:

```yaml
# packages.yml
---
- name: install php and mariadb
  hosts: dev, test, prod
  tasks:
    - dnf:
        name:
          - php
          - mariadb
        state: latest

- name: update packages on dev
  hosts: dev
  tasks:
    - dnf:
        name: '@RPM Development Tools'
        state: latest

    - dnf:
        name: "*"
        state: latest
```

**Validation Steps**:
1. Check installed packages: `dnf list installed php mariadb`
2. Verify package group: `dnf grouplist`
3. Confirm updates: `dnf updateinfo`

---
