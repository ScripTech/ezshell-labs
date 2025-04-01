---
title: "SELinux Port Configuration"
order: 3
description: "Configure SELinux to allow HTTP service on non-standard port"
difficulty: "medium"
points: 12
hint: "selinux-port-hint"
validationSteps:
  - "Check SELinux port label"
  - "Verify httpd configuration"
  - "Test service status"
  - "Validate port accessibility"
---

### Configuring SELinux Port for HTTP Service

* Your system has httpd service with some files in /var/www/html (do not change or alter these files)
* The httpd service is having issues and is not running on port 82
* Solve the problem to make the httpd service run on port 82

#### Expected Result
- SELinux configuration adjusted to allow httpd to run on port 82
- httpd service running successfully on port 82
