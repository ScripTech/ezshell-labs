---
title: "Managing User Authentication"
order: 5
description: "Configure HTPasswd authentication provider"
difficulty: "hard"
points: 25
hint: "auth-config-hint"
validationSteps:
  - "Verify HTPasswd configuration"
  - "Test user login"
  - "Validate permissions"
  - "Check OAuth settings"
---

### Configuring Authentication Provider

**Question**: Configure HTPasswd authentication for the cluster. Create users 'admin-user' and 'dev-user', grant cluster-admin role to 'admin-user', and project admin role for 'dev-project' to 'dev-user'.

**Answer**:
```bash
# Create HTPasswd file
htpasswd -c -B -b /tmp/htpasswd admin-user Admin123
htpasswd -b /tmp/htpasswd dev-user Dev123

# Create secret
oc create secret generic htpass-secret \
  --from-file=htpasswd=/tmp/htpasswd -n openshift-config

# Configure OAuth
oc get oauth cluster -o yaml > oauth.yaml
cat << EOF > oauth.yaml
apiVersion: config.openshift.io/v1
kind: OAuth
metadata:
  name: cluster
spec:
  identityProviders:
  - name: htpasswd_provider
    mappingMethod: claim
    type: HTPasswd
    htpasswd:
      fileData:
        name: htpass-secret
EOF
oc replace -f oauth.yaml

# Assign roles
oc adm policy add-cluster-role-to-user cluster-admin admin-user
oc new-project dev-project
oc policy add-role-to-user admin dev-user -n dev-project
```

**Explanation**:
- Creates HTPasswd authentication provider
- Configures OAuth for the cluster
- Sets up required users with appropriate roles
- Implements proper security practices
