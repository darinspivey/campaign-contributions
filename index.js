'use strict'

const nopt = require('nopt')
const division_defaults = require('./static/ocd-division-list.json')
const lib = require('./lib')

module.exports = start

const officials = []
let done_count = 0

/**
 * An event emitter to help us control flow without blocking the event
 * loop.  It will oversee the process from the initial candidate names
 * coming out of Goggle Civic, through the normalization process with Maplight,
 * and the ultimate download of all of the data we can find for the person
 * @type {EventEmitter}
 * @listens error - Generic error handler
 * @listens normalize_name - After getting Google Civic names, attempt to
 *   normalize to Maplight's data.  This allows us to work with an ID afterwards
 * @listens name_match_failed - When a corresponding Maplight record cannot
 *   be found for a given name, this can intercept the failures for manuall
 *   processing by someone.
 * @listens prepare_csv_download - When a Maplight ID is found for the
 *   candidate, this will instruct maplight to prepare a downloadable csv
 *   file with all matches.  This gets around their imposed 50-row limit.
 * @listens download_csv - After the server redies the CSV file, this gets it
 * @listens aggregate - Accepts a single row of contribution data to be
 *   aggregated into the main return structures.
 * @listens done - Called when each Civic name is complete.  After all
 *   are done, it will print the results.
 */
lib.controller
  .on('normalize_name', lib.getMaplightName)
  .on('prepare_csv_download', lib.prepareCSVDownload)
  .on('download_csv', lib.downloadCSV)
  .on('aggregate', lib.aggregations.aggregate)
  .on('done', function() {
    if (++done_count === officials.length) {
      this.removeAllListeners()
      lib.aggregations.printTotals()
    } else {
      console.log(`Completed ${done_count} of ${officials.length} politicians`)
    }
  })
  .on('name_match_failed', function(err) {
    // This would be a place where someone could manually fix normalization
    // issues.  Kick it to a rabbit queue, email; Anything to get eyes on it.
    // In a prod environment, we would have a database tracking these sort of
    // normalization anomalies, but for purposes of this exercise, just error.
    this.emit('error', err)
  })
  .on('error', function(err) {
    console.error('Contribution processing encountered an error', err)
    this.emit('done')
  })

function start(opts = {}) {
  const {
    api_key,
    divisions = division_defaults
  } = opts

  if (!api_key || !api_key.length) {
    const err = new Error('You must provide an API key to use for Google\'s API')
    throw err
  }
  Promise.all(
    // This is the only thing that will be awaited.  We need to gather the
    // complete list of politicians so we know how many will be processed.
    divisions.map(async (ocd_id) => {
      const list = await lib.getStateOfficials({ocd_id, api_key})
      if (list && list.length) {
        officials.push(...list)
      }
    })
  ).then(() => {
    for (const person of officials) {
      console.log('Researching contributions for ', person)
      lib.aggregations.initialize(person)
      // For maximum processing, this could probably be fitted with the `cluster`
      // module to process more in parallel.  The total list of names could be
      // divided up amongst the children, then cobined by the parent.
      lib.controller.emit('normalize_name', person)
    }
  }).catch((err) => {
    console.error('A hard error was encountered while getting officials', err)
    lib.controller.removeAllListeners()
  })
}

if (require.main === module) {
  const {api_key} = nopt({
    'api_key': String
    // Could also specify divisios here if you didn't wanna do all 50 states :)
  })
  start({api_key})
}
