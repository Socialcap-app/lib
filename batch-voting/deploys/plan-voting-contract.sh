#!/bin/bash

# $1 is Contract name = Communities, Claimings, Electors, Socialcap, PlanVoting
export NAME=PlanVoting

npm run build

node build/src/deploy/deploy-zkapp.js Berkeley proofsEnabled $NAME 
#> logs/$NAME.deploy.log
