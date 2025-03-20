### Configuring Autofs for NFS Home Directories

Configure autofs to automount the home directories of nfsuser user:

* nfsuser home directory is exported via NFS from ezetsu.nfslab.com
* NFS-exports directory is `/netdir` for netuser
* nfsuser's home directory is `ezetsu.nfslab.com:/home/guests/nfsuser`
* Home directories must be writable by their users
* Password for netuser is `kurozetsu`

<!-- #### Expected Result
  - Autofs configured to mount nfsuser's home directory
  - Home directory accessible and writable by nfsuser
  - Automounting works correctly -->
