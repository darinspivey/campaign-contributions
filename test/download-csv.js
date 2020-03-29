'use strict'

const {test, threw} = require('tap')
const common = require('./common.js')
const downloadCSV = require('../lib/download-csv.js')

const {
  controller,
  mockMaplightDownload,
  failRequest
} = common

const retval = 'http://some.server.com/some_file.csv'
const person = {
  name: 'Jack Burton',
  party: 'Pork Chop Express Party',
  maplight: {
    CandidateName: 'Jack Burton',
    CandidateMaplightID: 1234
  },
  csv_file: 'https://search.maplight.org/maplight-api/csv_downloads/xxx.csv'
}

test('download-csv', (t) => {
  t.afterEach(async () => {
    controller.removeAllListeners()
  })

  t.test('Success', (tt) => {
    tt.plan(4)
    let count = 0
    mockMaplightDownload('Col1,Col2,Col3\nOne,Two,Three\nFour,Five,Six\n')
    controller
      .on('done', () => {
        tt.pass('Emitted done event')
        tt.end()
      })
      .on('aggregate', (row) => {
        count++
        if (count === 1) {
          tt.deepEqual(row, {
            person,
            contribution: ['Col1', 'Col2', 'Col3']
          }, 'Column headers')
        } else if (count === 2) {
          tt.deepEqual(row, {
            person,
            contribution: ['One', 'Two', 'Three']
          }, 'Row 1')
        } else {
          tt.deepEqual(row, {
            person,
            contribution: ['Four', 'Five', 'Six']
          }, 'Row 2')
        }
      })

    downloadCSV(person)
  })

  t.test('Request error properly emits error', (tt) => {
    const message = 'CATASTROPHIC'
    controller.on('error', (err) => {
      tt.pass('Error was emitted')
      tt.equal(err.message, message, 'Error was passed through')
      tt.end()
    })
    failRequest({
      url: 'https://search.maplight.org',
      message
    })
    downloadCSV(person)
  })

  t.end()
}).catch(threw)
