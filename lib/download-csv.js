const request = require('request')
const csvParse = require('csv-parse')
const controller = require('./emitter-controller.js')

/**
 * Download a server-side generated CSV file containing a candidate's
 * contributions
 * @param  {Object} person - Contains information about a candidate
 * @return {undefined}
 * @emits error - Unexpected error handling
 * @emits aggregate - Each row is emitted to an aggregate function
 * @emits done - When the file (and candidate) is complete
 */
module.exports = function downloadCSV(person) {
  const {csv_file} = person
  const csv_stream = csvParse()
    .on('error', (err) => {
      csv_stream.removeAllListeners()
      const error = new Error('Error reading CSV stream')
      err.meta = {
        message: err.message
      }
      controller.emit('error', error)
    })
    .on('readable', function processCSVEntry() {
      let contribution
      while (contribution = this.read()) {
        // We have the raw data here.  Opportunity to memoize, save to DB,
        // or any number of caching strategies.
        controller.emit('aggregate', {
          person,
          contribution
        })
      }
    })
    .on('end', () => {
      controller.emit('done')
    })

  request.get(csv_file, (err) => {
    if (err) {
      controller.emit('error', err)
    }
  }).pipe(csv_stream)
}
