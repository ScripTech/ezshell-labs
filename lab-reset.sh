#!/bin/bash
set -eo pipefail

# Constants
LOG_FILE="/tmp/lab-reset.log"
SCRIPT_NAME=$(basename "$0")
PROTECTED_USER="labadmin"  # Add protected user constant
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
    # Check if running from correct directory
    if [ ! -d ".git" ]; then
        error_exit "This script must be run from the root of the lab directory."
    fi

    # Check if oc CLI is available
    if ! command -v oc >/dev/null 2>&1; then
       error_exit "OpenShift CLI (oc) is not installed or not in PATH"
    fi

    # Check if logged into cluster
    if ! oc whoami >/dev/null 2>&1; then
        error_exit "Not logged into OpenShift cluster"
    fi

    current_user=$(oc whoami)
    if [[ "$current_user" != "$PROTECTED_USER" ]]; then
        error_exit "This script must be run as $PROTECTED_USER user"
    fi
}

delete_user_resources() {
    local user="$1"
    local namespace="$2"

    # Skip if trying to delete protected user's resources
    if [[ "$user" == "$PROTECTED_USER" ]]; then
        log "Skipping protected user cluster resources: $PROTECTED_USER"
        return
    fi

    log "Processing resources for user: $user in namespace: $namespace"

    # Array of resources to delete in correct dependency order
    local resources=(
        "cronjobs"
        "jobs"
        "deployments"
        "statefulsets"
        "daemonsets"
        "replicasets"
        "pods"
        "services"
        "routes"
        "ingresses"
        "configmaps"
        "secrets"
        "pvc"
        "networkpolicies"
        "serviceaccounts"
        "rolebindings"
    )

    for resource in "${resources[@]}"; do
        log "Checking for $resource in namespace $namespace"
        local items
        items=$(oc get "$resource" -n "$namespace" --no-headers 2>/dev/null | grep "$user" | awk '{print $1}' || true)

        if [[ -n "$items" ]]; then
            while IFS= read -r item; do
                log "Deleting $resource: $item"
                oc delete "$resource" "$item" -n "$namespace" --wait=false >> "$LOG_FILE" 2>&1 || \
                    log "Warning: Failed to delete $resource: $item"
            done <<< "$items"
        fi
    done
}

delete_cluster_resources() {
    local user="$1"

    log "Processing cluster-wide resources for user: $user"

    # Delete cluster-wide resources
    local cluster_resources=(
        "clusterrolebindings"
        "persistentvolumes"
        "customresourcedefinitions"
    )

    for resource in "${cluster_resources[@]}"; do
        local items
        items=$(oc get "$resource" --no-headers 2>/dev/null | grep "$user" | awk '{print $1}' || true)

        if [[ -n "$items" ]]; then
            while IFS= read -r item; do
                log "Deleting cluster $resource: $item"
                oc delete "$resource" "$item" --wait=false >> "$LOG_FILE" 2>&1 || \
                    log "Warning: Failed to delete $resource: $item"
            done <<< "$items"
        fi
    done
}

main() {
    log "Starting lab environment reset"
    check_prerequisites

    # Get list of non-system users, excluding protected user
    users=$(oc get users -o jsonpath='{.items[*].metadata.name}' 2>/dev/null | \
           tr ' ' '\n' | grep -v "^${PROTECTED_USER}" | grep -v "^system:" || true)

    for user in $users; do
        if [[ ! "$user" =~ ^system: ]]; then
            log "Processing user: $user"

            # Get user's projects
            projects=$(oc get projects --no-headers 2>/dev/null | awk '{print $1}' || true)

            # Process each project
            for project in $projects; do
                delete_user_resources "$user" "$project"
            done

            # Process cluster-wide resources
            delete_cluster_resources "$user"

            # Finally delete the user
            log "Deleting user: $user"
            oc delete user "$user" --wait=false >> "$LOG_FILE" 2>&1 || \
                log "Warning: Failed to delete user: $user"
        fi
    done

    log "Lab environment reset completed"
}

# Execute main function
main "$@"
