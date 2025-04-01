---
title: "YUM Repository Configuration"
order: 2
description: "Configure YUM repositories for BaseOS and AppStream"
difficulty: "medium"
points: 10
hint: "yum-repo-hint"
validationSteps:
  - "Check devops.repo file existence"
  - "Validate BaseOS repository configuration"
  - "Validate AppStream repository configuration"
  - "Test repository connectivity"
  - "Verify package installation capability"
---

### Configuring YUM Repository

Configure your servera VM repository. The packages distribution should be available via YUM at `devops.repo` file:

Note: It's important that the name of the repo file is: `devops.repo`

* Name = DevOps-BaseOS
* Name = DevOps-AppStream

* Base OS URL = http://content.example.com/rhel8.0/x86_64/dvd/BaseOs
* App Stream URL = http://content.example.com/rhel8.0/x86_64/dvd/Appstream

#### Expected Result
- YUM repository configured with the provided URLs
- Ability to install packages from these repositories

#### Validation Criteria
1. The repository file exists at `/etc/yum.repos.d/devops.repo`
2. Both repositories are enabled
3. Package installation works from both repositories
