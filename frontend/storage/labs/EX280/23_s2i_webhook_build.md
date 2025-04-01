---
title: "S2I Build with Webhooks"
order: 23
description: "Configure Source-to-Image builds with GitHub webhooks"
difficulty: "hard"
points: 15
hint: "s2i-webhook-hint"
validationSteps:
  - "Verify BuildConfig creation"
  - "Check webhook configuration"
  - "Test automatic builds"
  - "Validate image creation"
  - "Monitor build logs"
---

### S2I Build Configuration

**Task**: Configure an S2I build with these requirements:

* Use Python 3.9 base image
* Source from: https://github.com/example/django-app
* Configure GitHub webhook for automatic builds
* Push to internal registry
* Set resource limits for builds
* Cache dependencies between builds

**Solution Steps**:
1. Create BuildConfig:
```yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: django-app
  namespace: demo-apps
spec:
  source:
    git:
      uri: https://github.com/example/django-app
      ref: main
    type: Git
  strategy:
    type: Source
    sourceStrategy:
      from:
        kind: ImageStreamTag
        name: python:3.9
        namespace: openshift
      env:
        - name: PIP_CACHE_DIR
          value: /tmp/pip-cache
  output:
    to// filepath: /Users/a254627/Development/eZetsu/ezshell-labs/frontend/storage/labs/EX280/23_s2i_webhook_build.md
---
title: "S2I Build with Webhooks"
order: 23
description: "Configure Source-to-Image builds with GitHub webhooks"
difficulty: "hard"
points: 15
hint: "s2i-webhook-hint"
validationSteps:
  - "Verify BuildConfig creation"
  - "Check webhook configuration"
  - "Test automatic builds"
  - "Validate image creation"
  - "Monitor build logs"
---

### S2I Build Configuration

**Task**: Configure an S2I build with these requirements:

* Use Python 3.9 base image
* Source from: https://github.com/example/django-app
* Configure GitHub webhook for automatic builds
* Push to internal registry
* Set resource limits for builds
* Cache dependencies between builds

**Solution Steps**:
1. Create BuildConfig:
```yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: django-app
  namespace: demo-apps
spec:
  source:
    git:
      uri: https://github.com/example/django-app
      ref: main
    type: Git
  strategy:
    type: Source
    sourceStrategy:
      from:
        kind: ImageStreamTag
        name: python:3.9
        namespace: openshift
      env:
        - name: PIP_CACHE_DIR
          value: /tmp/pip-cache
  output:
    to
