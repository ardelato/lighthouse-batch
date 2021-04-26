#!/usr/bin/env node
'use strict'

import commander from 'commander'
import execute, { OUT } from './index.js'

commander
  .option('-s, --sites [sites]', 'a comma delimited list of site urls to analyze with Lighthouse', (str) => str.split(','), [])
  .option('-f, --file [path]', 'an input file with a site url per-line to analyze with Lighthouse')
  .option('-p, --params <params>', 'extra parameters to pass to lighthouse cli for each execution e.g. -p "--perf --quiet"')
  .option('-o, --out [out]', `the output folder to place reports, defaults to '${OUT}'`)
  .option('-v, --verbose', 'enable verbose logging')
  .option('--print', 'print the final summary to stdout')
  .parse(commander.argv)

execute(commander.opts())
