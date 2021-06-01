#!/bin/bash

node run.js -t 3 -f ./master.txt --out "./report/lighthouse/master"

node run.js -t 3 -f ./new.txt --out "./report/lighthouse/new"
