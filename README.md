# Label action

A simple GitHub action to manage issue/PRs labels.

Example usage:

```yaml
---
name: Example

on:
  pull_request:

jobs:
  steps:
    - name: Add a "test" label
      uses: alessandrozanatta/label-action@v1
      with:
        add: test
```
