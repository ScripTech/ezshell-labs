### Hint: Find User Files

1. Use the `find` command to locate files owned by "natasha".
2. Combine `find` with `cp` to copy the files.
3. Use appropriate options to preserve file attributes.

Key elements to consider:
- `find / -user natasha`
- `cp -a` or `cp -p` for preserving attributes
- Handling potential permission issues (consider using `sudo`)
