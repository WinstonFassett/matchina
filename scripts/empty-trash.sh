#!/bin/bash

# Empty Trash - Clean up all trash/ prefixed branches
set -e

echo "🗑️  Emptying trash branches..."

# Get list of trash branches
TRASH_BRANCHES=$(git branch 2>/dev/null | grep '^  trash/' | sed 's/^[ *]*//' || true)

if [ -z "$TRASH_BRANCHES" ]; then
    echo "✅ No trash branches found"
    exit 0
fi

echo "Found trash branches:"
echo "$TRASH_BRANCHES"
echo

# Count branches safely
BRANCH_COUNT=$(echo "$TRASH_BRANCHES" | grep -c . || echo "0")

# Confirm deletion
read -p "Delete all $BRANCH_COUNT trash branches? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Delete all trash branches
echo "Deleting trash branches..."
echo "$TRASH_BRANCHES" | while read -r branch; do
    if [ -n "$branch" ]; then
        git branch -D "$branch" 2>/dev/null || echo "Failed to delete $branch"
    fi
done

echo "✅ Trash emptied!"
