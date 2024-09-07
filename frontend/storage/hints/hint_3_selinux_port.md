### Hint: SELinux Port Configuration

1. Check the current SELinux port settings for httpd.
2. Use `semanage` to add the new port to the allowed list.
3. Restart the httpd service after making changes.

Key commands to research:
- `semanage port -l | grep http`
- `semanage port -a -t http_port_t -p tcp 82`
- `systemctl restart httpd`
