### Configuring File Permissions

* Copy the file `/etc/fstab` to `/var/tmp`
* Configure the permissions of `/var/tmp/fstab` as follows:
  - Owned by the root user
  - Belongs to the root group
  - Not executable by anyone
  - User "natasha" can read and write
  - User "harry" cannot read or write
  - All other users (current or future) can read

<!-- #### Expected Result
  - File `/var/tmp/fstab` exists with correct ownership and permissions
  - Specified users have correct access rights -->
