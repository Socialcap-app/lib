#!/bin/bash

# $1 is Contract name = Communities, Claimings, Electors, Socialcap
cat logs/rollit.log >> logs/rollits-history.log

npm run build

node build/src/tests/voting-rollup-tests.js Berkeley proofsEnabled > logs/rollit.log
