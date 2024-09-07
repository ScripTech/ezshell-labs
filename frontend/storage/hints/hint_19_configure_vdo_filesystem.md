### Hint: Configure VDO Filesystem

1. Install the `vdo` package if not already installed.
2. Use `vdo create` to create a VDO volume.
3. Format the VDO volume with `mkfs.xfs`.
4. Mount the volume and add an entry to `/etc/fstab`.

Key commands:
- `vdo create --name=<name> --device=<device> --vdoLogicalSize=<size>`
- `mkfs.xfs /dev/mapper/<vdo_name>`
- Editing `/etc/fstab`
