#!/bin/bash

npm run build

node build/src/tests/run-nullifiers-test.js
