---
title: "Generate Hardware Report"
order: 13
description: "Create hardware report file with system facts"
difficulty: "medium"
points: 15
hint: "hardware-report-hint"
validationSteps:
  - "Verify /root/hwreport.txt content"
  - "Check system facts"
---

### Generating Hardware Report

**Question**:
Create a playbook `/home/admin/ansible/hwreport.yml` to:
- Download template from `http://server.network.example.com/materials/hwreport.empty` to `/root/hwreport.txt`
- Update the file with:
  - HOSTNAME
  - BIOS version
  - Total RAM (MB)
  - VDA_SIZE
  - VDB_SIZE

**Answer**:

```yaml
# /home/admin/ansible/hwreport.yml
---
- name: Generate hardware report on all managed nodes
  hosts: all
  gather_facts: true
  tasks:
    - name: Download initial hwreport template
      get_url:
        url: "http://server.network.example.com/materials/hwreport.empty"
        dest: /root/hwreport.txt
        mode: '0644'

    - name: Update HOSTNAME in hwreport.txt
      lineinfile:
        path: /root/hwreport.txt
        regexp: '^HOSTNAME=.*'
        line: "HOSTNAME={{ inventory_hostname | default('NONE') }}"

    - name: Update BIOS version in hwreport.txt
      lineinfile:
        path: /root/hwreport.txt
        regexp: '^BIOS=.*'
        line: "BIOS={{ ansible_facts['bios_version'] | default('NONE') }}"

    - name: Update TOTAL_RAM in hwreport.txt
      lineinfile:
        path: /root/hwreport.txt
        regexp: '^TOTAL_RAM=.*'
        line: "TOTAL_RAM={{ ansible_memtotal_mb | default('NONE') }}"

    - name: Update VDA_SIZE in hwreport.txt
      lineinfile:
        path: /root/hwreport.txt
        regexp: '^VDA_SIZE=.*'
        line: "VDA_SIZE={{ ansible_facts['devices']['vda']['size'] | default('NONE') }}"

    - name: Update VDB_SIZE in hwreport.txt
      lineinfile:
        path: /root/hwreport.txt
        regexp: '^VDB_SIZE=.*'
        line: "VDB_SIZE={{ ansible_facts['devices']['vdb']['size'] | default('NONE') }}"
```

**Validation Steps**:
1. Check file: `cat /root/hwreport.txt`
2. Confirm system facts are correct
---
