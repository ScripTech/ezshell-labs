---
title: "OAuth and LDAP Authentication"
order: 26
description: "Configure OpenShift authentication with LDAP integration"
difficulty: "hard"
points: 15
hint: "oauth-ldap-hint"
validationSteps:
  - "Verify LDAP connection"
  - "Test user authentication"
  - "Check group sync"
  - "Validate permissions"
  - "Monitor auth failures"
---

### OAuth LDAP Configuration

**Task**: Configure OpenShift authentication with these requirements:

* Set up LDAP authentication provider
* Configure group synchronization
* Map LDAP groups to OpenShift roles
* Set up nested group search
* Configure login timeout of 4 hours

**Solution Steps**:
1. Configure OAuth with LDAP:
```yaml
apiVersion: config.openshift.io/v1
kind: OAuth
metadata:
  name: cluster
spec:
  identityProviders:
  - name: corporate-ldap
    mappingMethod: claim
    type: LDAP
    ldap:
      attributes:
        id:
        - dn
        email:
        - mail
        name:
        - cn
        preferredUsername:
        - uid
      bindDN: "cn=directory manager"
      bindPassword:
        name: ldap-bind-password
      ca:
        name: ca-config-map
      insecure: false
      url: "ldaps://ldap.example.com:636/dc=example,dc=com?uid?sub?(objectClass=*)"
```

2. Create LDAP sync config:
```yaml
apiVersion: v1
kind: LDAPSyncConfig
metadata:
  name: group-sync
spec:
  rfc2307:
    groupsQuery:
      baseDN: "ou=groups,dc=example,dc=com"
      scope: sub
      derefAliases: never
      filter: "(objectClass=groupOfNames)"
    groupUIDAttribute: dn
    groupNameAttributes: [ cn ]
    groupMembershipAttributes: [ member ]
    usersQuery:
      baseDN: "ou=users,dc=example,dc=com"
      scope: sub
      derefAliases: never
      filter: "(objectClass=person)"
    userUIDAttribute: dn
    userNameAttributes: [ uid ]
```

3. Create group role bindings:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ldap-admins
subjects:
- kind: Group
  name: admins
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

**Verification**:
```bash
# Test LDAP connection
oc adm groups sync --sync-config=group-sync.yaml --confirm

# Check synchronized groups
oc get groups

# Test user authentication
oc login -u ldapuser1

# Verify group memberships
oc get groups admins -o yaml

# Check authentication events
oc get events -n openshift-authentication
```

**Expected Results**:
- LDAP users can authenticate
- Groups synchronized correctly
- Role bindings applied properly
- Nested groups resolved
- Login session timeout enforced
