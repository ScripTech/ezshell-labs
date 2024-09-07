### Hint: Configure Container

1. Pull the rsyslog image from the provided registry.
2. Create a systemd service file for the container.
3. Configure the service to run as the user "xanadu".
4. Set up the necessary volume mounts.
5. Enable and start the service.

Key steps:
- Using `podman` or `docker` to pull and run the container
- Creating a systemd service file in `/etc/systemd/system/`
- Using `systemctl` to enable and start the service
- Configuring volume mounts for the journal files
