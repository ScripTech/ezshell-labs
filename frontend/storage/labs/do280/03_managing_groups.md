---
title: "Managing Groups"
order: 3
description: "Configure Manage Identity Providers"
difficulty: "medium"
points: 10
tags:
  - "identity-provider"
  - "configuration"
  - "integration"
hint: "Ensure the group names and permissions are set correctly to allow access to the necessary resources."
steps:
  - "Create a new group named 'ex280-users', 'ex280-guests'"
  - "add qwerty to the group 'ex280-guests'"
  - "add susan andh harry to the group 'ex280-users'"
  - "give edit permissions to the group 'ex280-users' in project 'ex280-test'"
  - "give view permissions to the group 'ex280-guests' in project 'ex280-demo'"
validationSteps:
  - "Check that the group 'ex280-users' is created successfully"
  - "Confirm that users 'susan' and 'harry' are added to the group 'ex280-users'"
  - "Ensure that user 'qwerty' is added to the group 'ex280-guests'"
  - "Verify that the group 'ex280-users' has edit permissions in project 'ex280-test'"
  - "Verify that the group 'ex280-guests' has view permissions in project 'ex280-demo'"
---

### Managing Groups

Ensure the group names and permissions are set correctly to allow access to the necessary resources.

## Tasks

- Create a new group named `ex280-users` and `ex280-guests`
- Add user `qwerty` to the group `ex280-guests`
- Add users `susan` and `harry` to the group `ex280-users`
- Give edit permissions to the group `ex280-users` in project `ex280-test`
- Give view permissions to the group `ex280-guests` in project `ex280-demo`
