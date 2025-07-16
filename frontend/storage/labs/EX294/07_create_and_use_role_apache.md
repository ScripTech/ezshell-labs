---
title: "Create and Use Apache Role"
order: 7
description: "Create a custom role for Apache web server"
difficulty: "medium"
points: 15
hint: "apache-role-hint"
validationSteps:
  - "Verify role creation"
  - "Check template rendering"
  - "Validate firewall rules"
  - "Test web page output"
---

### Creating and Using Apache Role

**Question**:
Create a role called `apache` in `/home/admin/ansible/roles` with the following requirements:
- Install and enable `httpd` and `firewalld`
- Configure firewall to allow HTTP/HTTPS
- Use a template to create `/var/www/html/index.html` with message:
  `Welcome to HOSTNAME on IPADDRESS`
- HOSTNAME is the FQDN, IPADDRESS is the node's IP
- Create a playbook `/home/admin/ansible/newrole.yml` to use this role on hosts in the `webservers` group

**Answer**:

```bash
ansible-galaxy role init ~/ansible/roles/apache

# ~/ansible/roles/apache/templates/template.j2
My host is {{ ansible_facts['fqdn'] }} on {{ ansible_facts['default_ipv4']['address'] }}

# ~/ansible/roles/apache/tasks/main.yml
---
- name: Install httpd and firewalld packages
  ansible.builtin.dnf:
    name:
      - httpd
      - firewalld
    state: present

- name: Start and enable httpd and firewalld
  ansible.builtin.service:
    name: "{{ item }}"
    state: started
    enabled: true
  loop:
    - httpd
    - firewalld

- name: Add http/https to firewall
  ansible.posix.firewalld:
    service: "{{ item }}"
    state: enabled
    permanent: true
    immediate: true
  loop:
    - http
    - https

- name: Deploy web page from template
  ansible.builtin.template:
    src: template.j2
    dest: /var/www/html/index.html

# ~/ansible/newrole.yml
---
- name: Deploy Apache role on webservers
  hosts: webservers
  roles:
    - apache
```

**Validation Steps**:
1. Check index.html: `cat /var/www/html/index.html`
2. Test firewall: `firewall-cmd --list-all`
3. Curl web page: `curl http://<hostname>`
---
