#!/usr/bin/env node
'use strict'

/**
 * Commander is a Node Package that allows for easy to use command-line argument processing
 * https://www.npmjs.com/package/commander
 *
 * It allows for easier configuration and use of CLI arg flags, arg type definitions, and usage messages
 */
const program = require('commander')
const execute = require('./index')

/**
 * This is where the "flag" arguments are being set along with the type definitions in some cases
 */
program
  .version(require('./package.json').version)
  .option('-s, --sites [sites]', 'a comma delimited list of site urls to analyze with Lighthouse', (str) => str.split(','), [])
  .option('-f, --file [path]', 'an input file with a site url per-line to analyze with Lighthouse')
  .option('-p, --params <params>', 'extra parameters to pass to lighthouse cli for each execution e.g. -p "--perf --quiet"')
  .option('-h, --html', 'generate an html report alongside the json report')
  .option('--csv', 'generate a csv report alongside the json report')
  .option('-o, --out [out]', `the output folder to place reports, defaults to '${execute.OUT}'`)
  .option('--score <threshold>', `average score for each site to meet (1-100)`, Number)
  .option('--accessibility <threshold>', `accessibility score for each site to meet (1-100)`, Number)
  .option('--performance <threshold>', `performance score for each site to meet (1-100)`, Number)
  .option('--best-practices <threshold>', `best practice score for each site to meet (1-100)`, Number)
  .option('--seo <threshold>', `seo score for each site to meet (1-100)`, Number)
  .option('--pwa <threshold>', `pwa score for each site to meet (1-100)`, Number)
  .option('--fail-fast', `fail as soon as a budget threshold is not met`)
  .option('-g, --use-global', 'use a global lighthouse install instead of the dependency version')
  .option('-v, --verbose', 'enable verbose logging')
  .option('--no-report', 'remove individual json reports for each site')
  .option('--print', 'print the final summary to stdout')
  .parse(process.argv)

execute(program)
