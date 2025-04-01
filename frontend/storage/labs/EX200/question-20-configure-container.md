---
title: "Container Configuration"
order: 20
description: "Configure and run a containerized web service"
difficulty: "hard"
points: 15
hint: "container-hint"
validationSteps:
  - "Verify container runtime"
  - "Check container image"
  - "Test container startup"
  - "Validate web access"
  - "Check persistence"
---
### Configuring a Container to Start Automatically

* Create a container named "logserver" using the rsyslog image
* Configure it to run as a systemd service that should run from the existing user "xanadu" only
* The service should be named "container-logserver"
* It should automatically start at system reboot without manual intervention
* Copy any *.journal files from the host /var/log/journal directory and any subdirectories into the directory /home/xanadu/container_journal
* Configure the service to automatically mount the directory /home/xanadu/container_journal under /var/log/journal on the container

#### Expected Result
- Container running and accessible
- Web content served correctly
- Port 8080 accessible
- Service persists across reboots
