---
title: "Managing Container Images"
order: 3
description: "Work with container images and image streams"
difficulty: "hard"
points: 15
hint: "container-images-hint"
validationSteps:
  - "Check image stream creation"
  - "Verify image import"
  - "Test image triggers"
  - "Validate registry access"
  - "Check image tags"
---

### Managing Container Images

**Question**: How do you manage container images in OpenShift? Describe building, tagging, and pushing an image to the internal registry using `oc`.

**Answer**:
1. **Build**:
   - Create a build:
     ```bash
     oc new-build --name=my-app --binary=true --strategy=docker
     ```
   - Build from a directory:
     ```bash
     oc start-build my-app --from-dir=.
     ```
2. **Tag**:
   - Tag the image:
     ```bash
     oc tag my-app:latest my-project/my-app:v1
     ```
3. **Push**:
   - Automatically pushed to the internal registry by `oc new-build`.

**Additional Notes**:
- Use `oc get is` to manage ImageStreams.
- Import external images with `oc import-image`.
