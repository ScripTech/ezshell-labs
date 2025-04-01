---
title: "Installing an OpenShift Cluster"
order: 4
description: "Install and configure OpenShift using assisted installer"
difficulty: "hard"
points: 15
hint: "cluster-install-hint"
validationSteps:
  - "Verify DNS configuration"
  - "Check node discovery"
  - "Validate cluster operators"
  - "Test cluster access"
  - "Verify high availability"
---

### Installing an OpenShift Cluster

**Question**: Describe installing an OpenShift cluster using the assisted installer, including prerequisites and post-installation steps.

**Answer**:
1. **Prerequisites**:
   - Red Hat account.
   - Supported platform (e.g., AWS, bare metal).
   - DNS and load balancer setup.
2. **Installation**:
   - Use OpenShift Cluster Manager to generate a discovery ISO.
   - Boot nodes with the ISO and monitor progress.
3. **Post-Installation**:
   - Configure authentication, storage, monitoring, and RBAC.

**Additional Notes**:
- Ensure HA with multiple control plane nodes for production.
- Test connectivity pre-installation.
