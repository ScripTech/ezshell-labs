---
title: "Creating Limit ranges"
order: 3
description: "Create and manage Limit Ranges in OpenShift"
difficulty: "medium"
points: 10
tags:
  - "limit-ranges"
  - "configuration"
  - "management"
hint: "Ensure the limit ranges are set correctly to manage resource allocation effectively."
steps:
  - "Create a new project named 'ex280-limits'"
  - "Set the following limit ranges:"
  - "  - Default CPU: 500m"
  - "  - Default Memory: 512Mi"
  - "  - Max CPU: 1"
  - "  - Max Memory: 1Gi"
  - "  - Min CPU: 100m"
  - "  - Min Memory: 256Mi"
validationSteps:
  - "Check that the project 'ex280-limits' is created successfully"
  - "Confirm that the limit ranges are set as specified"
  - "Ensure that the limits for CPU and Memory are enforced correctly"
---
### Creating Limit Ranges

Create and manage Limit Ranges to control the allocation of resources within a project.

## Tasks

- Create a new project named `ex280-limits`
- Set the pod memory limit between 5Mi and 300Mi
- Set the pod CPU limit between 100m and 500m
- Set Container memory limit between 10Mi and 200Mi and container default request limit for memory is 100Mi
- The container CPU limit should be between 50m and 300m and the container default request limit for CPU is 100m
- Verify that the limit ranges are applied correctly
