---
title: "Rekey Ansible Vault"
order: 16
description: "Change the password for an existing Ansible vault"
difficulty: "medium"
points: 10
hint: "vault-rekey-hint"
validationSteps:
  - "Verify vault password change"
  - "Check new password file"
---

### Rekeying Ansible Vault

**Question**:
Download the vault file from `http://materials.example.com/salaries.yml` to `/home/admin/ansible/salaries.yml`.
Change the vault password from `redhat` to `redhat@123`.
Store the new password in `/home/admin/ansible/new_secret.txt`.

**Answer**:

```bash
# cd ~/ansible
wget http://materials.example.com/salaries.yml
ansible-vault rekey salaries.yml
# Enter current password: redhat
# Enter new password: redhat@123

echo "redhat@123" > new_secret.txt
chmod 600 new_secret.txt

ansible-vault view salaries.yml --vault-password-file=new_secret.txt
```

**Validation Steps**:
1. View vault with new password: `ansible-vault view salaries.yml --vault-password-file=new_secret.txt`
2. Check password file: `cat new_secret.txt`
---
