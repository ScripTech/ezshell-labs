---
title: "Time Synchronization Setup"
order: 10
description: "Configure chronyd for time synchronization"
difficulty: "medium"
points: 10
hint: "chrony-config-hint"
validationSteps:
  - "Verify chronyd installation"
  - "Check configuration file"
  - "Test NTP servers"
  - "Validate time sync"
  - "Check service status"
---

### Configuring Time Synchronization

Configure chronyd time synchronization with these requirements:

* Use classroom.example.com as NTP server
* Enable NTP client
* Configure iburst option

#### Expected Result
- chronyd service running
- Correct NTP server configured
- Time synchronization active
- Proper timezone set
