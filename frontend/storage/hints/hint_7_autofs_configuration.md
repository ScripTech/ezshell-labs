### Hint: Autofs Configuration

1. Install the `autofs` package if not already installed.
2. Edit the master map file (`/etc/auto.master`).
3. Create a new map file for the home directories.
4. Configure the map file with the correct NFS server and export path.
5. Restart the autofs service.

Key files to edit:
- `/etc/auto.master`
- A new map file (e.g., `/etc/auto.home`)
