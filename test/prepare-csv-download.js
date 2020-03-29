'use strict'

const {test, threw} = require('tap')
const common = require('./common.js')
const prepareCSVDownload = require('../lib/prepare-csv-download.js')

const {
  controller,
  mockMaplightPrepare,
  failRequest
} = common

const retval = 'http://some.server.com/some_file.csv'
const person = {
  name: 'Jack Burton',
  party: 'Pork Chop Express Party',
  maplight: {
    CandidateName: 'Jack Burton',
    CandidateMaplightID: 1234
  }
}

test('prepare-csv-download', (t) => {
  t.afterEach(async () => {
    controller.removeAllListeners()
  })

  t.test('Success', (tt) => {
    mockMaplightPrepare({retval})
    controller.on('download_csv', (_person) => {
      tt.deepEqual(_person, {
        ...person,
        csv_file: retval
      }, 'Emits the expected structure')
      tt.end()
    })
    prepareCSVDownload(person)
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
    prepareCSVDownload(person)
  })

  t.end()
}).catch(threw)
