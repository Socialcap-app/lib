#!/bin/bash

npm run build

node build/src/tests/main-communities-tests.js > t01.log &

node build/src/tests/main-claimings-tests.js > t02.log &

node build/src/tests/main-electors-tests.js > t03.log &
