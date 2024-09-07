### Hint: Create Swap Partition

1. Use `fdisk` or `parted` to create a new partition.
2. Set the partition type to swap.
3. Use `mkswap` to format the partition as swap.
4. Enable the swap with `swapon`.
5. Add an entry to `/etc/fstab` for persistence.

Key commands:
- `fdisk` or `parted`
- `mkswap`
- `swapon`
- Editing `/etc/fstab`
