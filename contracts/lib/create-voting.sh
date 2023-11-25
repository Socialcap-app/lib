#!/bin/bash

# $1 is Claim UID 

npm run build

node build/src/tests/voting-deploy-tests.js Berkeley proofsEnabled $1 >> logs/voting-$1.logs
