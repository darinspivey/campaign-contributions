const request = require('request')
const controller = require('./emitter-controller.js')

const MAX_ROWS = 1000000 // Self-imposed for performance

/**
 * Contacts Maplight and requests a CSV download of all party contributions
 * for the given Maplight (person) ID
 * @param  {Object} person - Contains information about a candidate
 * @return {undefined}
 * @emits download_csv - Signals the download for the given CSV filename
 * @emits error - Unexpected errors
 */
module.exports = function prepareCSVDownload(person) {
  const {maplight} = person

  request({
    url: 'https://search.maplight.org/fec-search/download',
    qs: {
      candidate_mlid: maplight.CandidateMaplightID,
      corp_pac: 0,
      rows: MAX_ROWS,
      election_cycle: [2020, 2018, 2016, 2014, 2012, 2010, 2008]
    }
  }, (err, res, body) => {
    if (err) {
      controller.emit('error', err)
      return
    }
    controller.emit('download_csv', {
      ...person,
      csv_file: body
    })
  })
}
