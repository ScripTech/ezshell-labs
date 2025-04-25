---
title: "Custom Build Strategies"
order: 29
description: "Implement custom build strategies and chained builds"
difficulty: "hard"
points: 15
hint: "custom-build-hint"
validationSteps:
  - "Verify build configuration"
  - "Test build pipeline"
  - "Check image layers"
  - "Validate build hooks"
  - "Monitor build metrics"
---

### Custom Build Configuration

**Task**: Configure a custom build strategy with these requirements:

* Create a chained build for a Java application
* First stage: compile Java source using Maven
* Second stage: create minimal runtime image
* Implement custom build hooks
* Configure resource limits for builds

**Solution Steps**:
1. Create first stage BuildConfig (compilation):
```yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: java-compile
  namespace: custom-builds
spec:
  source:
    git:
      uri: https://github.com/example/java-app
      ref: main
  strategy:
    sourceStrategy:
      from:
        kind: ImageStreamTag
        name: java-11-maven:latest
        namespace: openshift
  output:
    to:
      kind: ImageStreamTag
      name: java-app-binary:latest
  resources:
    limits:
      memory: "2Gi"
      cpu: "1"
    requests:
      memory: "1Gi"
      cpu: "500m"
```

2. Create second stage BuildConfig (runtime):
```yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: java-runtime
  namespace: custom-builds
spec:
  source:
    type: Image
    images:
    - from:
        kind: ImageStreamTag
        name: java-app-binary:latest
      paths:
      - sourcePath: /opt/app-root/src/target/app.jar
        destinationDir: "."
  strategy:
    dockerStrategy:
      from:
        kind: ImageStreamTag
        name: openjdk-11-runtime:latest
        namespace: openshift
      dockerfilePath: Dockerfile.runtime
  output:
    to:
      kind: ImageStreamTag
      name: java-app:latest
```

3. Create custom Dockerfile.runtime:
```dockerfile
FROM openjdk-11-runtime:latest
COPY app.jar /deployments/
EXPOSE 8080
CMD ["java", "-jar", "/deployments/app.jar"]
```

4. Configure build hooks:
```yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: java-runtime
  namespace: custom-builds
spec:
  # ...existing config...
  postCommit:
    script: "curl -X POST http://webhook.example.com/build-complete"
  successfulBuildsHistoryLimit: 5
  failedBuildsHistoryLimit: 2
```

**Verification**:
```bash
# Start the build pipeline
oc start-build java-compile -n custom-builds

# Monitor build progress
oc logs -f bc/java-compile
oc logs -f bc/java-runtime

# Check image layers
oc get istag java-app:latest -o json | jq '.image.dockerImageLayers'

# Test the application
oc new-app java-app:latest
oc expose service java-app
```

**Expected Results**:
- Both build stages complete successfully
- Final image is optimized for runtime
- Build hooks executed properly
- Resource limits enforced
- Application runs successfully from built image
