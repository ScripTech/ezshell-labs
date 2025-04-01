---
title: "Creating Users with Specific UIDs"
order: 13
description: "Create and configure user accounts with specific parameters"
difficulty: "medium"
points: 12
hint: "create-user-hint"
validationSteps:
  - "Verify user creation"
  - "Check UID assignment"
  - "Validate group membership"
  - "Test password settings"
  - "Verify home directory"
---

### Creating a User with Specific UID

* Create a user named "appservice"
* Set the UID for "appservice" to 2334
* Set the password for "appservice" to "anonymos"
* Secondary group: wheel
* Shell: /bin/bash
* Custom home directory: /home/db/dbadmin
* Password aging: max 90 days

#### Expected Result
- User created with correct UID
- Groups properly assigned
- Home directory created
- Password policies applied
