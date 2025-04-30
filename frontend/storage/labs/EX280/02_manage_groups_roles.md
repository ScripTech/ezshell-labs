---
title: "Managing Groups and Role-Based Access Control"
order: 2
description: "Configure OpenShift groups, roles, and permissions"
difficulty: "hard"
points: 25
hint: "group-role-hint"
validationSteps:
  - "Verify Group Creation"
  - "Check Group Membership"
  - "Validate Group Roles"
  - "Test Project Access"
  - "Check Resource Quotas"
---

### Managing Groups and RBAC in OpenShift

**Question**: Configure groups and role-based access control for your development teams:

1. Create the following groups:
   - `development-team`
   - `operations-team`
   - `qa-team`

2. Add users to groups:
   - Add `dev1-user` and `dev2-user` to `development-team`
   - Add `ops1-user` and `ops2-user` to `operations-team`
   - Add `qa1-user` and `qa2-user` to `qa-team`

3. Configure project access:
   - Create project `app-development` and grant `development-team` edit access
   - Create project `app-production` and grant `operations-team` admin access
   - Create project `app-testing` and grant `qa-team` view access

4. Set resource quotas for projects:
   - `app-development`: 10 pods, 4 CPU cores, 8Gi memory
   - `app-production`: 20 pods, 8 CPU cores, 16Gi memory
   - `app-testing`: 5 pods, 2 CPU cores, 4Gi memory

5. Configure special permissions:
   - Allow `development-team` to create BuildConfigs and DeploymentConfigs in `app-development`
   - Grant `operations-team` access to view all projects in the cluster
   - Give `qa-team` ability to execute pods in `app-testing`

**Answer**:
```bash
# Create groups
oc adm groups new development-team
oc adm groups new operations-team
oc adm groups new qa-team

# Add users to groups
oc adm groups add-users development-team dev1-user dev2-user
oc adm groups add-users operations-team ops1-user ops2-user
oc adm groups add-users qa-team qa1-user qa2-user

# Create projects and assign roles
oc new-project app-development
oc new-project app-production
oc new-project app-testing

oc policy add-role-to-group edit development-team -n app-development
oc policy add-role-to-group admin operations-team -n app-production
oc policy add-role-to-group view qa-team -n app-testing

# Set resource quotas
oc create quota dev-quota --hard=pods=10,cpu=4,memory=8Gi -n app-development
oc create quota prod-quota --hard=pods=20,cpu=8,memory=16Gi -n app-production
oc create quota test-quota --hard=pods=5,cpu=2,memory=4Gi -n app-testing

# Configure special permissions
oc policy add-role-to-group system:build-strategy-docker development-team -n app-development
oc policy add-cluster-role-to-group cluster-reader operations-team
oc policy add-role-to-group system:pod-exec qa-team -n app-testing
