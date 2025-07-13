---
title: "Deploy HAProxy and PHPInfo Roles"
order: 8
description: "Configure load balancing and PHP info page using roles"
difficulty: "medium"
points: 15
hint: "haproxy-phpinfo-hint"
validationSteps:
  - "Verify HAProxy configuration"
  - "Check PHP info page output"
  - "Test load balancing"
---

### Deploying HAProxy and PHPInfo Roles

**Question**:
Create a playbook `/home/admin/ansible/deploy-haproxy.yml` to:
- Run the `balancer` role on hosts in the `balancer` group to configure HAProxy for load balancing between webservers.
- Run the `phpinfo` role on hosts in the `webservers` group to deploy a PHP info page.
- Browsing to a balancer host should alternate between outputs from different webservers.
- Browsing to `/hello.php` on a webserver should show "Hello PHP World from FQDN" and PHP version.

**Answer**:

```yaml
# /home/admin/ansible/deploy-haproxy.yml
---
- name: Deploy balancer role on balancer hosts
  hosts: balancer
  roles:
    - balancer

- name: Deploy phpinfo role on webservers
  hosts: webservers
  roles:
    - phpinfo
```

**Validation Steps**:
1. Curl balancer host: `curl http://serverd.lab.example.com`
2. Curl webserver host: `curl http://serverb.lab.example.com/hello.php`
3. Check PHP version: `php -v`
---
