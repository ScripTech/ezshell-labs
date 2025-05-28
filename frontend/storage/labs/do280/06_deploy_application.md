---
title: "Deploy an Application"
order: 6
description: "Configure Manage Identity Providers"
difficulty: "medium"
points: 10
tags:
  - "application-deployment"
  - "configuration"
  - "management"
hint: "Ensure the application is deployed in the correct project and that all configurations are set as required."
steps:
  - "Use project 'ex280-demo'"
  - "Deploy an application named 'rocky' in the 'ex280-demo' project"
  - "The application should be reached via the route `http://rocky.apps.cluster.example.com`"
  - "Ensure the application is configured with the following settings:"
  - "  - Image: 'rocky:latest'"
  - "  - Replicas: 1"
  - "  - Resource limits: CPU: '500m', Memory: '512Mi'"
validationSteps:
  - "Check that the project 'ex280-demo' is created successfully"
  - "Verify that the application 'rocky' is deployed with the specified image and settings"
  - "Confirm that the application is running with 2 replicas and the resource limits are applied correctly"
---

### Deploy an Application

Deploy an application in OpenShift to ensure it is configured correctly and accessible via the specified route.

### Tasks

- Existence of project named `ex280-demo`
- Deploy an application named `ex280-app` in the `ex280-demo` project
- The application should be reached via the route `http://ex280-app.apps.cluster.example.com`
- Ensure the application is configured with the following settings:
  - Image: `rocky:latest`
  - Replicas: 2
  - Resource limits: CPU: `500m`, Memory: `512Mi`
<!--
## Validation

- Check that the project `ex280-demo` is created successfully
- Verify that the application `ex280-app` is deployed with the specified image and settings
- Confirm that the application is running with 1 replicas and the resource limits are applied correctly -->
