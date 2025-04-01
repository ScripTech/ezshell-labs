---
title: "Swap Space Configuration"
order: 16
description: "Create and configure swap space using LVM"
difficulty: "medium"
points: 10
hint: "swap-config-hint"
validationSteps:
  - "Check swap partition"
  - "Verify swap activation"
  - "Test swap priority"
  - "Validate persistence"
  - "Check swap size"
---
### Creating a Swap Partition

* Use LVM logical volume
* Size: 512MB
* Volume group: vg_system
* Logical volume name: lv_swap
* Higher priority than existing swap
* Persist across reboots

#### Expected Result
- Swap space created and active
- Correct priority set
- Persists after reboot
- Proper size allocated
