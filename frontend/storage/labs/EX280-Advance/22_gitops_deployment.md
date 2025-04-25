---
title: "GitOps Application Deployment"
order: 22
description: "Deploy applications using GitOps principles with ArgoCD"
difficulty: "hard"
points: 15
hint: "gitops-hint"
validationSteps:
  - "Verify ArgoCD installation"
  - "Check application sync"
  - "Test automatic deployment"
  - "Validate resource creation"
  - "Monitor sync status"
---

### GitOps Application Deployment

**Task**: Configure ArgoCD to deploy an application with the following requirements:

* Deploy from Git repository: https://github.com/example/nodejs-app
* Target namespace: gitops-demo
* Automatic sync enabled
* Self-healing enabled
* Prune resources on sync
* Health check using the application endpoint

**Solution Steps**:
1. Create the ArgoCD Application:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nodejs-app
  namespace: openshift-gitops
spec:
  project: default
  source:
    repoURL: https://github.com/example/nodejs-app
    targetRevision: main
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: gitops-demo
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

2. Configure health checks:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: openshift-gitops
data:
  resource.customizations: |
    apps/Deployment:
      health.lua: |
        hs = {}
        hs.status = "Progressing"
        if obj.status ~= nil then
          if obj.status.availableReplicas ~= nil and obj.status.availableReplicas > 0 then
            hs.status = "Healthy"
          end
        end
        return hs
```

**Verification**:
```bash
# Check ArgoCD application status
oc get application -n openshift-gitops nodejs-app

# Verify deployment
oc get deployment -n gitops-demo

# Test auto-sync by making a change in Git
git commit -am "Update container image version"
git push origin main

# Monitor sync status
oc get application nodejs-app -n openshift-gitops -w
```

**Expected Results**:
- Application automatically deploys from Git
- Changes in Git trigger new deployments
- Resources are properly created in target namespace
- Health checks confirm application availability
