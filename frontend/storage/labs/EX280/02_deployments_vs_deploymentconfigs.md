---
title: "Deployments vs DeploymentConfigs"
order: 2
description: "Compare and implement different deployment strategies"
difficulty: "medium"
points: 10
hint: "deployment-types-hint"
validationSteps:
  - "Create Deployment"
  - "Create DeploymentConfig"
  - "Test rollout strategies"
  - "Verify triggers"
  - "Compare behavior"
---

### Deployments vs. DeploymentConfigs

**Question**: Explain the difference between a Deployment and a DeploymentConfig in OpenShift. Provide an example scenario where you would prefer a DeploymentConfig over a Deployment.

**Answer**:
- **Deployment**:
  - Kubernetes-native object.
  - Manages pod replicas and rolling updates.
  - No automatic triggers or deployment hooks.
- **DeploymentConfig**:
  - OpenShift-specific resource.
  - Adds triggers (e.g., image/config changes) and hooks (pre-, mid-, post-).
  - More deployment strategy flexibility.

**Example Scenario**:
Use a DeploymentConfig in a CI/CD pipeline to automatically redeploy when a new image is pushed to the registry, unlike a Deployment, which requires manual updates.

**Additional Notes**:
- Deployments are portable across Kubernetes platforms.
- DeploymentConfigs suit OpenShift-specific automation needs.
