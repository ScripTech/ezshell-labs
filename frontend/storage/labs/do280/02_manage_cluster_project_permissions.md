---
title: "Manage Cluster Project and Permissions"
order: 2
description: "Manage Cluster Project and Permissions"
difficulty: "medium"
points: 10
tags:
  - "project"
  - "permissions"
  - "configuration"
hint: "Ensure the project and permissions are set correctly to allow access to the necessary resources."
steps:
  - "Create a new project named 'ex280-applo', 'ex280-demo', and 'ex280-test'"
  - "bob should have cluster administrator rights"
  - "jhon can create projects"
  - "qwerty cannot create projects"
  - "natasha should have 'viewer' role in the project 'ex280-applo' and 'ex280-test'"
  - "susan should have 'viewer' role in the project 'ex280-demo'"
  - "harry should have 'developer' role in the project 'ex280-test'"
  - "armstrong should have 'admin' access in the project 'ex280-applo'"
  - "kubeadmin should not exist"
validationSteps:
  - "Check that the project 'ex280-test' is created successfully"
  - "Confirm that users can access the project with their assigned roles"
  - "Ensure that user 'natasha' has 'viewer' role in the project 'ex280-applo' and 'ex280-test'"
  - "Ensure that user 'susan' has 'viewer' role in the project 'ex280-demo'"
  - "Ensure that user 'harry' has 'developer' role in the project 'ex280-test'"
  - "Ensure that user 'armstrong' has 'admin' access in the project 'ex280-applo'"
  - "Ensure that user 'kubeadmin' does not exist"
---

### Manage Cluster Project and Permissions

Create the projects `ex280-applo`, `ex280-demo`, and `ex280-test` with the following permissions:

- User `bob` should have cluster administrator rights.
- User `jhon` can create projects.
- User `qwerty` cannot create projects.
- User `natasha` should have 'viewer' role in the project `ex280-applo` and `ex280-test`.
- User `susan` should have 'viewer' role in the project `ex280-demo`.
- User `harry` should have 'developer' role in the project `ex280-test`.
- User `armstrong` should have 'admin' access in the project `ex280-applo`.
- Ensure that user `kubeadmin` does not exist.

## Tasks:

1. Create the projects `ex280-applo`, `ex280-demo`, and `ex280-test`.
2. Assign the specified roles and permissions to the users as described above.
3. Verify that the projects and permissions are set correctly.
