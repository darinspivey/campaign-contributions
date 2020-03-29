'use strict'

const {test, threw} = require('tap')
const common = require('./common.js')
const start = require('../index.js')

const {
  mockMaplightName,
  mockMaplightPrepare,
  mockMaplightDownload,
  mockGoogleCivic,
  failRequest
} = common

const civic_res = {
  officials: [
    {name: 'Dirk Diggler', party: 'Independent'}
  ]
}
const name_res = {
  data: {
    candidate_names: [
      {CandidateName: 'Dirk Diggler', CandidateMaplightID: 1234}
    ]
  }
}
const prepare_res =
  'https://search.maplight.org/maplight-api/csv_downloads/xxx.csv'

test('main index program (called start)', async (t) => {
  t.test('Success', async (tt) => {
    mockGoogleCivic({retval: civic_res})
    mockMaplightName({retval: name_res})
    mockMaplightPrepare({retval: prepare_res})
    mockMaplightDownload(
      'ElectionCycle,TransactionDate,TransactionAmount\n'
    + '2020,1-1-2020,10\n'
    + '2020,1-2-2020,50\n'
    )
    start({
      api_key: 'NOPE',
      divisions: ['calls/are/mocked']
    })
  })

  t.test('Fail: must provide an api key', async (tt) => {
    tt.throws(() => {
      start()
    }, {
      message: 'You must provide an API key to use for Google\'s API'
    }, 'expected to throw')
  })
}).catch(threw)
