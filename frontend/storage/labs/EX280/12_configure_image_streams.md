---
title: "Managing Image Streams"
order: 12
description: "Configure and manage image streams"
difficulty: "medium"
points: 20
hint: "imagestream-management-hint"
validationSteps:
  - "Verify ImageStream creation"
  - "Check image tags"
  - "Test image imports"
  - "Validate build triggers"
---

### Managing Image Streams

**Question**: Create an ImageStream for a custom application image, configure automatic imports from an external registry, and set up a trigger to rebuild deployments when the image changes.

**Answer**:

```yaml
# Create ImageStream
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: custom-app
  namespace: myproject
spec:
  lookupPolicy:
    local: false
  tags:
  - name: latest
    from:
      kind: DockerImage
      name: quay.io/myorg/custom-app:latest
    importPolicy:
      scheduled: true
```

```bash
# Configure deployment with trigger
oc create deployment custom-app --image=custom-app:latest
oc set triggers deployment/custom-app --from-image=custom-app:latest -c custom-app
```

**Additional Notes**:
- Monitor image import status with `oc get is`
- Check deployment triggers with `oc describe deployment/custom-app`
- Verify image pulls with `oc get events`
