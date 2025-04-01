# Creating a Pod with Resource Limits

**Question**: Using the `oc` command-line tool, create a pod named "my-pod" in the "default" namespace, using the "nginx:latest" image, with CPU limits set to 0.5 cores and memory limits set to 512Mi.

**Answer**:  
To create a pod with specific resource limits in OpenShift, use the `oc run` command with the `--limits` flag. Here’s the command:

```bash
oc run my-pod --image=nginx:latest --namespace=default --limits='cpu=500m,memory=512Mi'
```

- **Explanation**:
  - `oc run my-pod`: Creates a pod named "my-pod".
  - `--image=nginx:latest`: Specifies the container image.
  - `--namespace=default`: Places the pod in the "default" namespace.
  - `--limits='cpu=500m,memory=512Mi'`: Sets CPU limits to 0.5 cores (500 millicores) and memory limits to 512MiB.

After running this command, OpenShift deploys the pod with the specified constraints.

**Additional Notes**:  
- Resource limits prevent overconsumption of cluster resources.
- Verify the pod with `oc get pods` and inspect limits with `oc describe pod my-pod`.
- Use `--requests` for minimum resource requirements (e.g., `--requests='cpu=250m,memory=256Mi'`).
