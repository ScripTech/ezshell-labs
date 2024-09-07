### Hint: Collaborative Directory

1. Use `mkdir` to create the directory.
2. Use `chown` to set ownership.
3. Use `chmod` to set permissions.
4. Set the SGID bit to ensure new files inherit the group.
5. Use `setfacl` to set default ACLs for the directory.

Key commands to research:
- `mkdir -p`
- `chown :sysadm`
- `chmod 2770`
- `setfacl -d`
