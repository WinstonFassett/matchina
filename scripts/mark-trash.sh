#!/bin/bash

# Usage: ./mark_trash.sh branch1 branch2 branch3 ...

for branch in "$@"; do
    if git show-ref --verify --quiet "refs/heads/$branch"; then
        new_branch="trash/$branch"
        echo "Renaming $branch -> $new_branch"
        git branch -m "$branch" "$new_branch"
    else
        echo "Branch $branch does not exist, skipping"
    fi
done
