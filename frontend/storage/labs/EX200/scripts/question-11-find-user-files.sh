#!/bin/bash

# Validation script for "Finding and Copying User Files" task

# Initialize variables
TASK_DIR="/task-11/natashafiles"
USER="natasha"
SCRIPT_NAME="find-all-files.sh"
EXIT_STATUS=0

# Function to print result and update exit status
print_result() {
    if [ $1 -eq 0 ]; then
        echo "PASS: $2"
    else
        echo "FAIL: $2"
        EXIT_STATUS=1
    fi
}

# Validation Step 1: Verify search criteria in the script
echo "Checking search criteria in $SCRIPT_NAME..."
if [ -f "$SCRIPT_NAME" ]; then
    if grep -q "find .* -user $USER" "$SCRIPT_NAME"; then
        print_result 0 "Search criteria for user $USER found in $SCRIPT_NAME"
    else
        print_result 1 "Search criteria for user $USER not found in $SCRIPT_NAME"
    fi
else
    print_result 1 "Script $SCRIPT_NAME does not exist"
fi

# Validation Step 2: Check if target directory exists
echo "Checking file locations..."
if [ -d "$TASK_DIR" ]; then
    print_result 0 "Target directory $TASK_DIR exists"
else
    print_result 1 "Target directory $TASK_DIR does not exist"
fi

# Validation Step 3: Validate file ownership
echo "Validating file ownership..."
if [ -d "$TASK_DIR" ]; then
    NON_NATASHA_FILES=$(find "$TASK_DIR" -not -user "$USER" | wc -l)
    if [ "$NON_NATASHA_FILES" -eq 0 ]; then
        print_result 0 "All files in $TASK_DIR are owned by $USER"
    else
        print_result 1 "Some files in $TASK_DIR are not owned by $USER"
    fi
else
    print_result 1 "Cannot validate ownership: $TASK_DIR does not exist"
fi

# Validation Step 4: Test file permissions preservation
echo "Testing file permissions..."
if [ -d "$TASK_DIR" ]; then
    # Find original files owned by natasha and compare permissions
    ORIGINAL_FILES=$(find / -user "$USER" -type f 2>/dev/null | head -n 5)
    PERMISSION_MISMATCH=0
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            REL_PATH=${file#/}
            COPIED_FILE="$TASK_DIR/$REL_PATH"
            if [ -f "$COPIED_FILE" ]; then
                ORIG_PERMS=$(stat -c %a "$file" 2>/dev/null)
                COPY_PERMS=$(stat -c %a "$COPIED_FILE" 2>/dev/null)
                if [ "$ORIG_PERMS" != "$COPY_PERMS" ]; then
                    PERMISSION_MISMATCH=1
                    break
                fi
            fi
        fi
    done <<< "$ORIGINAL_FILES"
    if [ $PERMISSION_MISMATCH -eq 0 ]; then
        print_result 0 "File permissions preserved in $TASK_DIR"
    else
        print_result 1 "File permissions not preserved in $TASK_DIR"
    fi
else
    print_result 1 "Cannot validate permissions: $TASK_DIR does not exist"
fi

# Validation Step 5: Confirm copy operation and directory structure
echo "Confirming copy operation and directory structure..."
if [ -d "$TASK_DIR" ]; then
    # Check if files exist in the target directory
    COPIED_FILES=$(find "$TASK_DIR" -type f | wc -l)
    if [ "$COPIED_FILES" -gt 0 ]; then
        # Verify directory structure preservation
        ORIGINAL_DIRS=$(find / -user "$USER" -type d 2>/dev/null | grep -v "^/task-11" | head -n 5)
        STRUCTURE_MISMATCH=0
        while IFS= read -r dir; do
            if [ -n "$dir" ]; then
                REL_PATH=${dir#/}
                if [ ! -d "$TASK_DIR/$REL_PATH" ] && [ "$REL_PATH" != "" ]; then
                    STRUCTURE_MISMATCH=1
                    break
                fi
            fi
        done <<< "$ORIGINAL_DIRS"
        if [ $STRUCTURE_MISMATCH -eq 0 ]; then
            print_result 0 "Files copied and directory structure maintained in $TASK_DIR"
        else
            print_result 1 "Directory structure not maintained in $TASK_DIR"
        fi
    else
        print_result 1 "No files found in $TASK_DIR"
    fi
else
    print_result 1 "Cannot confirm copy operation: $TASK_DIR does not exist"
fi

# Exit with appropriate status
if [ $EXIT_STATUS -eq 0 ]; then
    echo "Validation successful: All checks passed!"
    exit 0
else
    echo "Validation failed: One or more checks did not pass."
    exit 1
fi
