#!/usr/bin/env node
'use strict'

const program = require('commander')
const execute = require('./index')

program
  .version(require('./package.json').version)
  .option('-s, --sites [sites]', 'a comma delimited list of site urls to analyze with Lighthouse', (str) => str.split(','), [])
  .option('-f, --file [path]', 'an input file with a site url per-line to analyze with Lighthouse')
  .option('-p, --params <params>', 'extra parameters to pass to lighthouse cli for each execution e.g. -p "--perf --quiet"')
  .option('-o, --out [out]', `the output folder to place reports, defaults to '${execute.OUT}'`)
  .option('-v, --verbose', 'enable verbose logging')
  .option('--print', 'print the final summary to stdout')
  .parse(process.argv)

execute(program.opts())
