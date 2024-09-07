### Hint: Time Synchronization

1. Install the `chrony` package if not already installed.
2. Edit the chrony configuration file.
3. Add the classroom server as the time source.
4. Restart the chrony service.

Key files and commands:
- `/etc/chrony.conf`
- `systemctl restart chronyd`
- `chronyc sources` to verify
