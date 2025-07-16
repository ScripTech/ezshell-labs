---
title: "Create User Accounts"
order: 15
description: "Create developer and manager user accounts using Ansible"
difficulty: "medium"
points: 20
hint: "user-accounts-hint"
validationSteps:
  - "Verify user creation"
  - "Check group membership"
  - "Validate password hash"
---

### Creating User Accounts

**Question**:
Download user list from `http://materials.example.com/user_list.yml`.
Using the password vault `/home/admin/ansible/locker.yml`, create a playbook `/home/admin/ansible/users.yml` to:
- Create developer users on dev and test hosts, assign password from `pw_developer`, add to group `devops`
- Create manager users on prod hosts, assign password from `pw_manager`, add to group `opsmgr`
- Use SHA512 password hash

**Answer**:

```yaml
# /home/admin/ansible/users.yml
---
- name: Create developer user accounts on dev and test hosts
  hosts: dev,test
  vars_files:
    - locker.yml
    - user_list.yml
  tasks:
    - name: create group
      group:
        name: devops
        state: present

    - name: Create developer user accounts
      user:
        name: "{{ item.name | lower }}"
        uid: "{{ item.uid }}"
        password: "{{ pw_developer | password_hash('sha512') }}"
        groups: devops
        create_home: true
        state: present
      loop: "{{ users }}"
      when: item.job == 'developer'

- name: Create manager user accounts on prod hosts
  hosts: prod
  vars_files:
    - locker.yml
    - user_list.yml
  tasks:
    - name: create group
      group:
        name: opsmgr
        state: present

    - name: Create manager user accounts
      user:
        name: "{{ item.name | lower }}"
        uid: "{{ item.uid }}"
        password: "{{ pw_manager | password_hash('sha512') }}"
        groups: opsmgr
        create_home: true
        state: present
      loop: "{{ users }}"
      when: item.job == 'manager'
```

**Validation Steps**:
1. Check user accounts: `getent passwd | grep -i <username>`
2. Check group membership: `groups <username>`
3. Verify password hash: `sudo cat /etc/shadow | grep <username>`
---
