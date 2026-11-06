#!/bin/bash
# Pre-push privacy verification check
# Run this before pushing to ensure no personal data is exposed

set -e

echo "Running privacy verification..."

# Run privacy verification script
node scripts/verify-privacy.js

# Run privacy tests
node tests/privacy.test.js

echo ""
echo "✓ All privacy checks passed - safe to push"
