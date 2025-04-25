---
title: "Enabling Developer Self-Service"
order: 7
description: "Configure project templates and quotas"
difficulty: "medium"
points: 20
hint: "self-service-hint"
validationSteps:
  - "Verify template creation"
  - "Test project creation"
  - "Validate quota enforcement"
  - "Check limit ranges"
---

### Configuring Developer Self-Service

**Question**: Create a project template that automatically applies resource quotas (10 pods, 4 CPU cores, 8Gi memory) and limit ranges for containers (min: 100m CPU/128Mi memory, max: 1 CPU/1Gi memory) when developers create new projects.

**Answer**:

```yaml
# Create project template
apiVersion: template.openshift.io/v1
kind: Template
metadata:
  name: project-request
  namespace: openshift-config
objects:
- apiVersion: v1
  kind: ResourceQuota
  metadata:
    name: ${PROJECT_NAME}-quota
  spec:
    hard:
      pods: "10"
      requests.cpu: "4"
      requests.memory: 8Gi
- apiVersion: v1
  kind: LimitRange
  metadata:
    name: ${PROJECT_NAME}-limits
  spec:
    limits:
    - type: Container
      min:
        cpu: 100m
        memory: 128Mi
      max:
        cpu: "1"
        memory: 1Gi
parameters:
- name: PROJECT_NAME
  required: true
```

```bash
# Apply the template
oc create -f template.yaml
oc patch project.config.openshift.io/cluster \
  --patch '{"spec":{"projectRequestTemplate":{"name":"project-request"}}}' \
  --type=merge
```

- **Explanation**:
  - Creates project template with quotas
  - Defines container limits
  - Automatically applies to new projects
  - Ensures resource constraints

**Additional Notes**:
- Test template with new project creation
- Monitor quota usage
- Adjust limits based on needs
- Document for developers
