---
title: "SELinux Port Configuration Hints"
relatedQuestion: "question-3-selinux-port"
---

### Helpful Commands

1. Check current SELinux port labels:
```bash
semanage port -l | grep http
```

2. Add new port to SELinux:
```bash
semanage port -a -t http_port_t -p tcp 82
```

3. Verify httpd configuration:
```bash
grep "Listen" /etc/httpd/conf/httpd.conf
```

4. Manage service:
```bash
systemctl restart httpd
systemctl status httpd
```

5. Test port:
```bash
curl http://localhost:82
```

Remember to:
- Check SELinux is enforcing
- Verify port is not already in use
- Check system logs for SELinux denials
