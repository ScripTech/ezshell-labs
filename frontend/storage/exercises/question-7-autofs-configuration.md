### Configuring Autofs for NFS Home Directories

Configure autofs to automount the home directories of netuserX user:

* netuserX home directory is exported via NFS from classroom.example.com (172.25.254.254)
* NFS-exports directory is `/netdir` for netuser
* netuserX's home directory is `classroom.example.com:/home/guests/netuserX`
* Home directories must be writable by their users
* Password for netuser is `ablerate`

<!-- #### Expected Result
  - Autofs configured to mount netuserX's home directory
  - Home directory accessible and writable by netuserX
  - Automounting works correctly -->
