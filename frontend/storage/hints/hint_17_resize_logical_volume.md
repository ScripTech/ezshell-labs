### Hint: Resize Logical Volume

1. Use `lvresize` or `lvextend` to resize the logical volume.
2. Use `resize2fs` to resize the filesystem (if it's ext4).

Key commands:
- `lvresize -L <new_size> /dev/volume_group/logical_volume`
- `resize2fs /dev/volume_group/logical_volume`
