# Label action

A simple GitHub action to manage issue/PRs labels. Gitea compatible!

Example usage:

```yaml
---
name: Example

on:
  pull_request:

jobs:
  steps:
    - uses: alessandrozanatta/label-action@v1.0.0
      with:
        add: test
        remove: deleteme
        gitea: true # <-- use this if running on Gitea to allow removing labels correctly!
        github_token: "${{ secrets.GITHUB_TOKEN }}"
        repo: "${{ github.repository }}"
        number: "1"
```
