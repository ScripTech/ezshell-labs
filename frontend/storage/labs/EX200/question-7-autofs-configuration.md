---
title: "Automounter Configuration"
order: 7
description: "Configure autofs to mount remote NFS shares"
difficulty: "hard"
points: 15
hint: "autofs-hint"
validationSteps:
  - "Verify autofs installation"
  - "Check configuration files"
  - "Test automatic mounting"
  - "Validate unmount timeout"
  - "Check mount permissions"
---

### Configuring AutoFS

Configure autofs to automount the home directories of nfsuser user:

* nfsuser home directory is exported via NFS from ezetsu.nfslab.com
* NFS-exports directory is `/netdir` for netuser
* nfsuser's home directory is `ezetsu.nfslab.com:/home/guests/nfsuser`
* Home directories must be writable by their users
* Password for netuser is `kurozetsu`


#### Expected Result
- Automatic mounting on access
- Correct timeout behavior
- Proper permissions preserved
****
