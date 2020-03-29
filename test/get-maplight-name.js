'use strict'

const {test} = require('tap')
const common = require('./common.js')
const getMaplightName = require('../lib/get-maplight-name.js')

const {
  controller,
  mockMaplightName,
  failRequest
} = common

test('get-maplight-name', (t) => {
  t.afterEach(async () => {
    controller.removeAllListeners()
  })

  const retval = {
    data: {
      candidate_names: [
        {CandidateName: 'Dirk Diggler'}
      ]
    }
  }
  t.test('It handles manual name matches', (tt) => {
    controller.on('prepare_csv_download', (person) => {
      tt.deepEqual(person, {
        name: 'Tom Cotton',
        party: 'XXX',
        maplight: {
          CandidateName: 'Thomas Cotton',
          CandidateMaplightID: 6192
        }
      })
      tt.end()
    })
    getMaplightName({name: 'Tom Cotton', party: 'XXX'})
  })

  t.test('Successful exact name match', (tt) => {
    mockMaplightName({retval})
    controller.on('prepare_csv_download', (person) => {
      tt.deepEqual(person, {
        name: 'Dirk Diggler',
        party: 'XXX',
        maplight: {
          CandidateName: 'Dirk Diggler'
        }
      })
      tt.end()
    })
    getMaplightName({name: 'Dirk Diggler', party: 'XXX'})
  })

  t.test('Successful match despite suffixes and initials', (tt) => {
    mockMaplightName({retval})
    controller.on('prepare_csv_download', (person) => {
      tt.deepEqual(person, {
        name: 'Dirk D. Diggler III',
        party: 'XXX',
        maplight: {
          CandidateName: 'Dirk Diggler'
        }
      })
      tt.end()
    })
    getMaplightName({name: 'Dirk D. Diggler III', party: 'XXX'})
  })

  t.test('Successful match ignores full middle names', (tt) => {
    mockMaplightName({retval})
    controller.on('prepare_csv_download', (person) => {
      tt.deepEqual(person, {
        name: 'Dirk Derrick Diggler III',
        party: 'XXX',
        maplight: {
          CandidateName: 'Dirk Diggler'
        }
      })
      tt.end()
    })
    getMaplightName({name: 'Dirk Derrick Diggler III', party: 'XXX'})
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
    getMaplightName({name: 'XXX', party: 'XXX'})
  })

  t.test('No possibilities were returned', (tt) => {
    const message = 'Candidate name search returned nothing!'
    controller.on('error', (err) => {
      tt.pass('Error was emitted')
      tt.equal(err.message, message, 'Expected error is correct')
      tt.end()
    })
    mockMaplightName({retval: {data: {candidate_names:[]}}})
    getMaplightName({name: 'XXX', party: 'XXX'})
  })

  t.test('No matches', (tt) => {
    const message = 'First and Last name match failed'
    controller
      .on('name_match_failed', function(){
        tt.pass('Name match event fired')
        tt.end()
      })
    mockMaplightName({retval})
    getMaplightName({name: 'NO MATCH', party: 'XXX'})
  })

  t.end()
})
