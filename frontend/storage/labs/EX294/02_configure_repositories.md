---
title: "Configure YUM Repositories"
order: 2
description: "Configure BaseOS and AppStream repositories on all nodes"
difficulty: "medium"
points: 15
hint: "yum-repo-hint"
validationSteps:
  - "Verify repository configuration"
  - "Check repo files"
  - "Validate package installation"
---

### Configuring YUM Repositories

**Question**:
Create a playbook to configure two YUM repositories on all managed nodes:
- Repository 1: Name `EX294_BASE`, description `EX294 base software`, baseurl `http://content/rhel9.0/x86_64/dvd/BaseOS`, gpgkey `http://content.example.com/rhel9.0/x86_64/dvd/RPM-GPG-KEY-redhat-release`
- Repository 2: Name `EX294_STREAM`, description `EX294 stream software`, baseurl `http://content/rhel9.0/x86_64/dvd/AppStream`, gpgkey as above

**Answer**:

```yaml
# yum.yml
---
- name: Configure repositories on all nodes
  hosts: all
  become: true
  tasks:
    - name: Configure BaseOS repository
      ansible.builtin.yum_repository:
        file: BaseOS
        name: EX294_BASE
        description: "EX294 base software"
        baseurl: "http://content/rhel9.0/x86_64/dvd/BaseOS"
        enabled: true
        gpgcheck: true
        gpgkey: "http://content.example.com/rhel9.0/x86_64/dvd/RPM-GPG-KEY-redhat-release"
        state: present

    - name: Configure AppStream repository
      ansible.builtin.yum_repository:
        file: Appstream
        name: EX294_STREAM
        description: "EX294 stream software"
        baseurl: "http://content/rhel9.0/x86_64/dvd/AppStream"
        enabled: true
        gpgcheck: true
        gpgkey: "http://content.example.com/rhel9.0/x86_64/dvd/RPM-GPG-KEY-redhat-release"
        state: present
```

**Validation Steps**:
1. Verify repo files: `ls /etc/yum.repos.d/`
2. Check repo list: `dnf repolist all`
3. Test package installation: `dnf install php -y`

---
