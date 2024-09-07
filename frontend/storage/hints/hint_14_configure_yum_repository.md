### Hint: Configure YUM Repository

1. Create two separate `.repo` files in `/etc/yum.repos.d/`, one for BaseOS and one for AppStream.
2. Include necessary repository information in each file.

Key elements to include in each file:
- `[repo-id]`
- `name=`
- `baseurl=`
- `enabled=1`
- `gpgcheck=0`
