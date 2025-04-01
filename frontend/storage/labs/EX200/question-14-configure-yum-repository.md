---
title: "YUM Repository Configuration"
order: 14
description: "Configure local YUM repository with custom packages"
difficulty: "medium"
points: 12
hint: "yum-repo-hint"
validationSteps:
  - "Check repository file"
  - "Verify repository settings"
  - "Test package installation"
  - "Validate GPG key"
  - "Check repository listing"
---

### Configuring YUM Repository

Configure your serverb VM repository. The packages distribution should be available via YUM:

* Base OS URL = http://content.example.com/rhel8.0/x86_64/dvd/BaseOs
* App Stream URL = http://content.example.com/rhel8.0/x86_64/dvd/Appstream


#### Expected Result
- Repository properly configured
- Packages accessible via yum/dnf
- Repository enabled and working
