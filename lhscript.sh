#!/bin/bash
TIMES=5

node run.js -t $TIMES -f ./master.txt --out "./report/lighthouse/master"

node run.js -t $TIMES -f ./new.txt --out "./report/lighthouse/new"

node summary.js $TIMES