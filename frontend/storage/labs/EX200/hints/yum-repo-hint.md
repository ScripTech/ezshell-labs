---
title: "YUM Repository Configuration Hints"
relatedQuestion: "question-2-yum-repository"
---

### Helpful Commands

1. Create the repository file:
```bash
vim /etc/yum.repos.d/devops.repo
```

2. Repository file template:
```ini
[DevOps-BaseOS]
name=DevOps-BaseOS
baseurl=http://content.example.com/rhel8.0/x86_64/dvd/BaseOs
enabled=1
gpgcheck=0

[DevOps-AppStream]
name=DevOps-AppStream
baseurl=http://content.example.com/rhel8.0/x86_64/dvd/Appstream
enabled=1
gpgcheck=0
```

3. Verify repository configuration:
```bash
yum repolist
yum clean all
yum makecache
```

4. Test package installation:
```bash
yum search httpd
```
