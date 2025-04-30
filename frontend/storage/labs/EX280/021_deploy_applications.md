---
title: "Deploying Applications with Source-to-Image (S2I)"
order: 17
description: "Deploy an application using S2I strategy"
difficulty: "medium"
points: 20
hint: "s2i-deployment-hint"
validationSteps:
  - "Verify BuildConfig creation"
  - "Check build status"
  - "Validate deployment"
  - "Test application access"
---

### Deploying Applications Using S2I

**Question**: Deploy a Python application from the Git repository `https://github.com/openshift/django-ex.git` using Source-to-Image. The application should have 3 replicas and use the latest Python 3.9 builder image.

**Answer**:
```bash
oc new-app python:3.9~https://github.com/openshift/django-ex.git --name=django-app
oc scale deployment/django-app --replicas=3
oc expose service/django-app
```

**Explanation**:
- Uses S2I to build and deploy a Python application
- Automatically creates BuildConfig and DeploymentConfig
- Scales the deployment to 3 replicas
- Exposes the service with a route

---
