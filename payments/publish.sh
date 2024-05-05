#!/bin/bash
# Publish to NPM

pnpm run build

pnpm publish --access public --no-git-checks
