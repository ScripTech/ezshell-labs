---
title: "VDO Storage Configuration"
order: 19
description: "Create and configure VDO storage with deduplication"
difficulty: "hard"
points: 15
hint: "vdo-config-hint"
validationSteps:
  - "Verify VDO installation"
  - "Check VDO volume"
  - "Test deduplication"
  - "Validate compression"
  - "Check mount options"
---
### Configuring VDO Storage

Create a VDO volume with these specifications:

* Device: /dev/vdd
* VDO volume name: vdo_storage
* Logical size: 10GB
* Enable deduplication and compression
* Mount at /vdo_data with XFS filesystem
* Persistent mount configuration

#### Expected Result
- VDO volume created and configured
- Deduplication active
- Compression enabled
- Filesystem mounted and accessible
- Configuration persists after reboot
