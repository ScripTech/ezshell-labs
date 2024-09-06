### Creating a collaborative directory

* Create a directory `/shared/sysadm` with the following characteristics:
  - Group ownership of `/shared/sysadm` is `sysadm`
  - The directory should be readable, writable, and accessible to members of `sysadm`, but not to any other user
  - Files created in `/shared/sysadm` automatically have group ownership set to the `sysadm` group

**Note:** It is understood that root has access to all files and directories on the system.

<!-- #### Expected Result
  - Directory `/shared/sysadm` created with correct permissions
  - Group ownership set to `sysadm`
  - Automatic group ownership for new files -->
