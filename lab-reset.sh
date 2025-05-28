#!/bin/bash
set -eo pipefail

# Constants
LOG_FILE="./logs/lab-reset.log"
SCRIPT_NAME=$(basename "$0")
PROTECTED_USER="labadmin"
HTPASSWD_PROVIDER_NAME="ex280-secret-provider"  # Target identity provider
HTPASSWD_SECRET_NAME="ex280-secure"  # Secret for ex280-secret-provider
OAUTH_YAML="/tmp/oauth.yaml"  # Path to predefined OAuth configuration

# DO280 specific projects to clean up
PROJECTS_TO_DELETE=(
    "ex280-demo"
    "ex280-quotas"
    "ex280-limits"
    "ex280-test"
)

# DO280 specific groups to clean up
GROUPS_TO_DELETE=(
    "ex280-users"
    "ex280-guests",
    "ex280-admins",
    "ex280-developers",
    "guest-users",
    "site-users"
)

# Resource configurations to clean up
RESOURCE_CONFIGS=(
    "resourcequota"
    "limitrange"
    "hpa"
)

# Predefined OAuth configuration (excluding ex280-secret-provider)
cat << EOF > "$OAUTH_YAML"
apiVersion: config.openshift.io/v1
kind: OAuth
metadata:
  name: cluster
spec:
  identityProviders:
  - htpasswd:
      fileData:
        name: htpasswd-secret
    mappingMethod: claim
    name: htpasswd-provider
    type: HTPasswd
EOF

# Functions
log() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

check_prerequisites() {
    # Check if oc CLI is available
    if ! command -v oc >/dev/null 2>&1; then
        error_exit "OpenShift CLI (oc) is not installed or not in PATH"
    fi

    # Check if logged into cluster
    if ! oc whoami >/dev/null 2>&1; then
        error_exit "Not logged into OpenShift cluster"
    fi

    # Verify user is labadmin
    local current_user
    current_user=$(oc whoami)
    if [[ "$current_user" != "$PROTECTED_USER" ]]; then
        error_exit "This script must be run as $PROTECTED_USER user"
    fi
}

reset_identity_provider() {
    log "Resetting $HTPASSWD_PROVIDER_NAME identity provider"

    # Check if the identity provider exists
    if oc get oauth cluster -o jsonpath="{.spec.identityProviders[?(@.name==\"$HTPASSWD_PROVIDER_NAME\")]}" >/dev/null 2>&1; then
        log "Applying predefined OAuth configuration to remove $HTPASSWD_PROVIDER_NAME"
        if oc replace -f "$OAUTH_YAML" >/dev/null 2>&1; then
            log "Removed $HTPASSWD_PROVIDER_NAME from OAuth configuration"
        else
            log "Error: Failed to apply OAuth configuration from $OAUTH_YAML"
            return 1
        fi
    else
        log "No $HTPASSWD_PROVIDER_NAME identity provider found"
    fi
}

delete_htpasswd_secret() {
    log "Deleting $HTPASSWD_SECRET_NAME secret"
    if oc get secret "$HTPASSWD_SECRET_NAME" -n openshift-config >/dev/null 2>&1; then
        log "Deleting secret: $HTPASSWD_SECRET_NAME"
        oc delete secret "$HTPASSWD_SECRET_NAME" -n openshift-config --wait=false >/dev/null 2>&1 || {
            log "Warning: Failed to delete secret $HTPASSWD_SECRET_NAME"
            return 1
        }
        log "Deleted secret $HTPASSWD_SECRET_NAME"
    else
        log "Secret $HTPASSWD_SECRET_NAME does not exist, skipping"
    fi
}

cleanup_users_and_groups() {
    log "Cleaning up users associated with $HTPASSWD_PROVIDER_NAME"

    # Get all users associated with the identity provider
    local users
    users=$(oc get users -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null)

    if [ -z "$users" ]; then
        log "No users found in the cluster"
    else
        local user_count=0
        while IFS= read -r user; do
            if [ -z "$user" ]; then
                log "Skipping empty user entry"
                continue
            fi
            # Retrieve identity, trimming any trailing characters (e.g., %, newlines)
            local identity
            identity=$(oc get user "$user" -o jsonpath='{.identities[0]}' 2>/dev/null | tr -d '\n\r%')
            if [ -n "$identity" ] && [[ "$identity" =~ ^${HTPASSWD_PROVIDER_NAME}: ]]; then
                log "Deleting user: $user (identity: $identity)"
                oc delete user "$user" --wait=false >/dev/null 2>&1 || log "Warning: Failed to delete user: $user"
                oc delete identity "$identity" --wait=false >/dev/null 2>&1 || log "Warning: Failed to delete identity: $identity"
                user_list+=("$user")
                ((user_count++))
            else
                log "Skipping user: $user (identity: ${identity:-none})"
            fi
        done <<< "$users"
        log "Deleted $user_count user(s) associated with $HTPASSWD_PROVIDER_NAME"
    fi

    # Delete groups
    for group in "${GROUPS_TO_DELETE[@]}"; do
        if oc get group "$group" >/dev/null 2>&1; then
            log "Deleting group: $group"
            oc delete group "$group" --wait=false >/dev/null 2>&1 || log "Warning: Failed to delete group: $group"
        else
            log "Group $group does not exist, skipping"
        fi
    done

    # Clean up role bindings referencing deleted users or groups
    log "Cleaning up role bindings for deleted users and groups"
    local subjects=("${user_list[@]}" "${GROUPS_TO_DELETE[@]}")
    for subject in "${subjects[@]}"; do
        # Namespace-scoped RoleBindings
        for project in "${PROJECTS_TO_DELETE[@]}"; do
            if oc get rolebinding -n "$project" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null | grep -q .; then
                while IFS= read -r rb; do
                    if oc get rolebinding "$rb" -n "$project" -o jsonpath="{.subjects[?(@.name==\"$subject\")]}" >/dev/null 2>&1; then
                        log "Deleting RoleBinding $rb in project $project referencing $subject"
                        oc delete rolebinding "$rb" -n "$project" --wait=false >/dev/null 2>&1 || \
                            log "Warning: Failed to delete RoleBinding $rb in project $project"
                    fi
                done <<< "$(oc get rolebinding -n "$project" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null)"
            fi
        done
        # ClusterRoleBindings
        if oc get clusterrolebinding -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null | grep -q .; then
            while IFS= read -r crb; do
                if oc get clusterrolebinding "$crb" -o jsonpath="{.subjects[?(@.name==\"$subject\")]}" >/dev/null 2>&1; then
                    log "Deleting ClusterRoleBinding $crb referencing $subject"
                    oc delete clusterrolebinding "$crb" --wait=false >/dev/null 2>&1 || \
                        log "Warning: Failed to delete ClusterRoleBinding $crb"
                fi
            done <<< "$(oc get clusterrolebinding -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null)"
        fi
    done
}

cleanup_projects() {
    log "Cleaning up DO280 projects"

    for project in "${PROJECTS_TO_DELETE[@]}"; do
        if oc get project "$project" >/dev/null 2>&1; then
            log "Deleting project: $project"
            oc delete project "$project" --wait=false >/dev/null 2>&1 || log "Warning: Failed to delete project: $project"
        else
            log "Project $project does not exist, skipping"
        fi
    done
}

cleanup_resource_configs() {
    log "Cleaning up DO280 resource configurations"

    for project in "${PROJECTS_TO_DELETE[@]}"; do
        if oc get project "$project" >/dev/null 2>&1; then
            for config in "${RESOURCE_CONFIGS[@]}"; do
                if oc get "$config" -n "$project" >/dev/null 2>&1; then
                    log "Deleting $config in project: $project"
                    oc delete "$config" --all -n "$project" --wait=false >/dev/null 2>&1 || \
                        log "Warning: Failed to delete $config in project: $project"
                else
                    log "No $config found in project: $project"
                fi
            done
        fi
    done
}

cleanup_deployments() {
    log "Cleaning up DO280 deployments"

    for project in "${PROJECTS_TO_DELETE[@]}"; do
        if oc get project "$project" >/dev/null 2>&1; then
            if oc get deployment -n "$project" >/dev/null 2>&1; then
                log "Deleting all deployments in project: $project"
                oc delete deployment --all -n "$project" --wait=false >/dev/null 2>&1 || \
                    log "Warning: Failed to delete deployments in project: $project"
            else
                log "No deployments found in project: $project"
            fi
        fi
    done
}

main() {
    log "Starting DO280 lab environment reset at $(date)"
    check_prerequisites

    # Reset in specific order to handle dependencies
    cleanup_users_and_groups
    cleanup_deployments
    cleanup_resource_configs
    cleanup_projects
    reset_identity_provider
    delete_htpasswd_secret

    # Wait for projects to be fully deleted
    for project in "${PROJECTS_TO_DELETE[@]}"; do
        while oc get project "$project" >/dev/null 2>&1; do
            log "Waiting for project $project to be deleted..."
            sleep 5
        done
    done

    # Clean up temporary oauth.yaml
    if [ -f "$OAUTH_YAML" ]; then
        rm "$OAUTH_YAML" >/dev/null 2>&1
        log "Cleaned up temporary $OAUTH_YAML"
    fi

    log "DO280 lab environment reset completed at $(date)"
}

# Execute main function
main "$@"
