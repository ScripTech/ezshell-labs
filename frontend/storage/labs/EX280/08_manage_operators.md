---
title: "Managing OpenShift Operators"
order: 8
description: "Install and configure OpenShift Operators"
difficulty: "hard"
points: 20
hint: "operator-management-hint"
validationSteps:
  - "Verify operator installation"
  - "Check operator status"
  - "Validate custom resources"
  - "Test operator functionality"
---

### Installing and Configuring Operators

**Question**: Install the ElasticSearch Operator in the `openshift-operators` namespace, create an ElasticSearch cluster instance with 3 nodes, and configure storage using the `managed-premium` storage class.

**Answer**:

```yaml
# First, create the Operator Subscription
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: elasticsearch-operator
  namespace: openshift-operators
spec:
  channel: stable
  name: elasticsearch-operator
  source: redhat-operators
  sourceNamespace: openshift-marketplace
```

```yaml
# Then, create the ElasticSearch cluster
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: elasticsearch-cluster
  namespace: openshift-operators
spec:
  version: 7.10.1
  nodeSets:
  - name: default
    count: 3
    config:
      node.store.allow_mmap: false
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
        storageClassName: managed-premium
```

**Additional Notes**:
- Wait for operator installation to complete
- Monitor operator status using `oc get csv`
- Check cluster health with `oc get elasticsearch`
- Verify storage provisioning
