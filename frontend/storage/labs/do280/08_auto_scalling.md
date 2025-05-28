---
title: "Autoscalling Scaling Applications"
order: 7
description: "Autoscale applications to handle varying loads and maintain performance."
difficulty: "medium"
points: 10
tags:
  - "autoscaling"
  - "applications"
  - "performance"
hint: "Ensure the application is configured to scale automatically based on resource usage."
steps:
  - "Set the autoscaling for the application 'ex280-app' with the following settings:"
  - "  - Minimum replicas: 4"
  - "  - Maximum replicas: 10"
  - "  - Target CPU utilization: 70%"
  - "  - Default request for container memory should be 100Mi and cpu 25m"
validationSteps:
  - "Check that the autoscaling is configured correctly for the application 'ex280-app'"
  - "Verify that the minimum replicas are set to 4 and maximum replicas to 10"
  - "Confirm that the target CPU utilization is set to 70%"
  - "Ensure that the application CPU request is set to 25m and CPU limit to 100m"
---
### Autoscaling Applications

Autoscale applications to handle varying loads and maintain performance.

### Tasks

- Set the autoscaling for the application `ex280-app` with the following settings:
  - Minimum replicas: 4
  - Maximum replicas: 10
  - Target CPU utilization: 70%
  - Default request for container memory should be 100Mi and cpu 25m
