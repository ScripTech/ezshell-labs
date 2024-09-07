### Hint: User and Group Management

1. Use `groupadd` to create the `sysadm` group.
2. Use `useradd` with appropriate options to create users and assign groups.
3. Use `passwd` to set passwords.
4. Edit `/etc/sudoers` or create a file in `/etc/sudoers.d/` to configure sudo permissions.

Key commands to research:
- `groupadd`
- `useradd -G`
- `usermod -aG`
- `passwd`
- `visudo`
