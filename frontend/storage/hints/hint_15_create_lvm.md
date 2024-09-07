### Hint: Create LVM

1. Use `lvcreate` to create the logical volume.
2. Format the volume with `mkfs.ext4`.
3. Mount the volume and add an entry to `/etc/fstab`.

Key commands to research:
- `lvcreate -L <size> -n <name> <volume-group>`
- `mkfs.ext4`
- `mount`
- Editing `/etc/fstab`
