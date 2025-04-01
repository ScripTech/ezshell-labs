---
title: "LVM Configuration"
order: 15
description: "Create and configure Logical Volume Management"
difficulty: "hard"
points: 15
hint: "lvm-config-hint"
validationSteps:
  - "Verify physical volumes"
  - "Check volume group"
  - "Validate logical volumes"
  - "Test filesystem mount"
  - "Check persistence"
---
### Creating an LVM

Create an LVM named "wshare" from the "wgroup" volume group with the following specifications:

* PE size should be 8MB
* LVM size should be 50 extents
* Format with "ext4" file system
* Mount it under "/mnt/wshare"
* It should auto mount after the next reboot

#### Expected Result
- LVM structure created correctly
- Filesystem mounted and accessible
- Mount persists across reboots
- Proper permissions set
