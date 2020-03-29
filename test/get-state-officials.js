'use strict'

const {test, threw} = require('tap')
const common = require('./common.js')
const getStateOfficials = require('../lib/get-state-officials.js')

const {
  mockGoogleCivic,
  failRequest
} = common

const retval = {
  officials: [
    {name: 'Darin Spivey', party: 'The Secret Party'},
    {name: 'Joe Schmoe', party: 'Independent'}
  ]
}

test('get-state-officials', async (t) => {

  t.test('Success', async (tt) => {
    mockGoogleCivic({retval})
    const result = await getStateOfficials({
      ocd_id: 'does/not/matter',
      api_key: 'XXXX'
    })
    tt.deepEqual(result, retval.officials, 'Expected return structure')
  })

  t.test('Data failure', async (tt) => {
    mockGoogleCivic({retval: {
      error: {
        code: 404,
        message: 'That API is not found'
      }
    }})
    const result = await getStateOfficials({
      ocd_id: 'does/not/matter',
      api_key: 'XXXX'
    })
    tt.deepEqual(result, [], 'Expected return structure')
  })

  t.test('Request error throws', async (tt) => {
    failRequest({
      url: 'https://www.googleapis.com',
      message: 'NOPE'
    })
    await tt.rejects(getStateOfficials({
      ocd_id: 'does/not/matter',
      api_key: 'XXXX'
    }), {
      message: 'NOPE'
    }, 'Expected to throw')
  })
}).catch(threw)
