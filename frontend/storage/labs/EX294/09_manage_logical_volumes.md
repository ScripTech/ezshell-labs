---
title: "Manage Logical Volumes"
order: 9
description: "Create and format logical volumes with error handling"
difficulty: "medium"
points: 15
hint: "lvm-management-hint"
validationSteps:
  - "Verify logical volume creation"
  - "Check fallback size"
  - "Validate ext4 formatting"
---

### Managing Logical Volumes

**Question**:
Create a playbook `/home/admin/ansible/lvm.yml` to:
- Create a logical volume named `data` in the `research` volume group, size 1500 MiB.
- If creation fails, fallback to 800 MiB.
- If volume group does not exist, display error.
- Format the logical volume as ext4.
- Do not mount the volume.

**Answer**:

```yaml
# /home/admin/ansible/lvm.yml
---
- name: Manage Logical Volume on managed nodes
  hosts: all
  become: true
  tasks:
    - name: Check if volume group 'research' exists
      command: "vgs research"
      register: vg_check
      ignore_errors: true

    - name: Fail if volume group 'research' does not exist
      fail:
        msg: "Volume Group does not exist"
      when: vg_check.failed

    - name: Create logical volume 'data' with 1500 MiB in VG research
      lvol:
        vg: research
        lv: data
        size: 1500m
      register: lv_1500
      when: not vg_check.failed

    - name: Check if creation of LV 'data' with 1500 MiB failed
      debug:
        msg: "Could not create Logical volume of that size; using fallback size of 800 MiB"
      when: lv_1500.failed

    - name: Create logical volume 'data' with 800 MiB fallback
      lvol:
        vg: research
        lv: data
        size: 800m
      register: lv_800
      when: lv_1500.failed

    - name: Format logical volume 'data' with ext4 filesystem
      filesystem:
        fstype: ext4
        dev: "/dev/research/data"
      when: (lv_1500 is defined and not lv_1500.failed) or (lv_800 is defined and not lv_800.failed)
```

**Validation Steps**:
1. Check LV: `lvs research`
2. Check filesystem: `lsblk -f`
---
