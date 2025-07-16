---
title: "Create Ansible Vault"
order: 14
description: "Store user passwords securely using Ansible Vault"
difficulty: "medium"
points: 15
hint: "vault-password-hint"
validationSteps:
  - "Verify vault file creation"
  - "Check encrypted variables"
  - "Validate password file"
---

### Creating Ansible Vault

**Question**:
Create an Ansible vault named `/home/admin/ansible/locker.yml` containing:
- Variable `pw_developer` with value `Imadev`
- Variable `pw_manager` with value `Imamgr`
Encrypt the vault using password `redhat`, stored in `/home/admin/ansible/secret.txt`.

**Answer**:

```bash
# cd ~/ansible
ansible-vault create locker.yml
# Enter the following content:
---
pw_developer: Imadev
pw_manager: Imamgr

# Create password file
echo "redhat" > secret.txt
chmod 600 secret.txt

# View vault contents
ansible-vault view locker.yml --vault-password-file=secret.txt
```

**Validation Steps**:
1. Check vault file: `ls -l locker.yml`
2. View vault: `ansible-vault view locker.yml --vault-password-file=secret.txt`
3. Check password file: `cat secret.txt`
---
