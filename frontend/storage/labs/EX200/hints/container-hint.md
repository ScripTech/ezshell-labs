---
title: "Container Configuration Hints"
relatedQuestion: "question-20-configure-container"
---

### Helpful Commands

1. Install and verify podman:
```bash
dnf install podman
podman --version
```

2. Pull and run container:
```bash
podman pull httpd:2.4
podman run -d --name web-service \
  -p 8080:80 \
  -v /web/content:/usr/local/apache2/htdocs:Z \
  httpd:2.4
```

3. Configure systemd service:
```bash
cd ~/.config/systemd/user
podman generate systemd --name web-service --files
systemctl --user enable container-web-service
loginctl enable-linger $USER
```

4. Test container:
```bash
curl http://localhost:8080
podman ps
podman logs web-service
```

Remember to:
- Set proper SELinux context for mounted volume
- Configure firewall if needed
- Check container logs for errors
