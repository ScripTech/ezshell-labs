---
title: "Managing Resouce quotas"
order: 3
description: "Manage Resource Quotas in OpenShift"
difficulty: "medium"
points: 10
tags:
  - "resource-quotas"
  - "configuration"
  - "management"
hint: "Ensure the resource quotas are set correctly to manage resource allocation effectively."
steps:
  - "Create a new project for project 'ex280-quotas'"
  - "Pod: 3"
  - "CPU: 2"
  - "Services: 6"
  - "Memory: 1Gi"
  - "Secrets: 5"
  - "replication controllers: 6"
  - "Verify that the quotas are applied correctly"
validationSteps:
  - "Check that the project 'ex280-quotas' is created successfully"
  - "Confirm that the resource quotas are set as specified"
  - "Ensure that the limits for pods, CPU, services, memory, secrets, and replication controllers are enforced"
---
### Managing Resource Quotas

Manage resource quotas in OpenShift to control the allocation of resources within a project.

## Tasks

- Create a new project named `ex280-quotas`
- Set the following resource quotas:
  - Pods: 3
  - CPU: 2
  - Services: 6
  - Memory: 1Gi
  - Secrets: 5
  - Replication Controllers: 6
- Verify that the quotas are applied correctly
