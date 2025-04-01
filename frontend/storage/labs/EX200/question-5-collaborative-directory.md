---
title: "Collaborative Directory Setup"
order: 5
description: "Create and configure a shared directory with specific permissions"
difficulty: "medium"
points: 10
hint: "collab-dir-hint"
validationSteps:
  - "Verify directory creation"
  - "Check group ownership"
  - "Validate SGID bit"
  - "Test file creation permissions"
  - "Verify collaborative access"
---

### Creating a Collaborative Directory

Create a collaborative directory `/shared_projects` with the following specifications:

* Group ownership: developers
* SGID bit set
* Full access for group members
* Read-only for others

#### Expected Result
- Directory exists with correct permissions
- New files inherit group ownership
- Group members can create and modify files
