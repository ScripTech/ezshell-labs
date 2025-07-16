---
title: "Install and Configure Ansible"
order: 1
description: "Set up Ansible control node, inventory, and configuration"
difficulty: "medium"
points: 15
hint: "ansible-setup-hint"
validationSteps:
  - "Verify Ansible installation"
  - "Check inventory file"
  - "Validate ansible.cfg settings"
  - "Test connectivity to managed nodes"
---

### Installing and Configuring Ansible

**Question**:
Install and configure Ansible on the control node as follows:
- Install the required packages.
- Create a static inventory file `/home/admin/ansible/inventory` with the following host groups:
  - `dev`: servera.lab.example.com
  - `test`: serverb.lab.example.com
  - `prod`: serverc.lab.example.com
  - `balancers`: serverd.lab.example.com
  - `webservers` group includes `prod` as a child group.
- Create a configuration file `/home/admin/ansible/ansible.cfg`:
  - Set inventory file path
  - Define roles and collections paths
  - Configure privilege escalation settings

**Answer**:

```bash
# Install Ansible and required packages
sudo dnf install ansible-navigator ansible-core container-tools vim tree -y

# Create inventory file
cat << EOF > /home/admin/ansible/inventory
[dev]
servera.lab.example.com

[test]
serverb.lab.example.com

[prod]
serverc.lab.example.com

[balancers]
serverd.lab.example.com

[webservers:children]
prod
EOF

# Create ansible.cfg
cat << EOF > /home/admin/ansible/ansible.cfg
[defaults]
inventory = ./inventory
remote_user = devops
ask_pass = false
roles_path = ./roles
collections_paths = ./collections

[privilege_escalation]
become = true
become_method = sudo
become_user = root
become_ask_pass = false
EOF
```

**Validation Steps**:
1. Confirm Ansible is installed: `ansible --version`
2. Verify inventory file: `cat /home/admin/ansible/inventory`
3. Check ansible.cfg: `cat /home/admin/ansible/ansible.cfg`
4. Test connectivity: `ansible all -m ping`

---
