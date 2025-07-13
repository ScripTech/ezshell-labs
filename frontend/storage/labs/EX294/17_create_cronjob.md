---
title: "Create Cronjob"
order: 17
description: "Schedule a cron job for user natasha"
difficulty: "easy"
points: 10
hint: "cronjob-hint"
validationSteps:
  - "Verify cron job creation"
  - "Check cron job schedule"
---

### Creating Cronjob

**Question**:
Create a playbook `/home/admin/ansible/cron.yml` to:
- Schedule a cron job for user `natasha` on all nodes
- Run every 2 minutes
- Execute: `logger "EX294 in progress"`

**Answer**:

```yaml
# /home/admin/ansible/cron.yml
---
- name: Create cronjob for user natasha on all nodes
  hosts: all
  tasks:
    - name: Setup cron job for natasha to log "EX294 in progress" every 2 minutes
      cron:
        name: "EX294 status logger"
        user: natasha
        minute: "*/2"
        job: 'logger "EX294 in progress"'
        state: present
```

**Validation Steps**:
1. Check cron job: `crontab -u natasha -l`
2. Verify log entries: `grep "EX294 in progress" /var/log/messages`
---
