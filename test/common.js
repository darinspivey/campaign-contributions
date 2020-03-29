'use strict'

const nock = require('nock')

module.exports = {
  controller: require('../lib/emitter-controller.js'),
  mockMaplightName,
  mockMaplightPrepare,
  mockMaplightDownload,
  mockGoogleCivic,
  failRequest
}

function mockMaplightName(opts) {
  const {
    retval,
    code = 200
  } = opts

  return nock('https://search.maplight.org')
    .get(/maplight-api\/fec\/candidate_names\/(.+)/)
    .reply(code, retval)
}

function mockMaplightPrepare(opts) {
  const {
    retval,
    code = 200
  } = opts

  return nock('https://search.maplight.org')
    .get(/fec-search\/download$/)
    .query({
      candidate_mlid: /^\d+$/,
      corp_pac: 0,
      rows: /^\d+$/,
      election_cycle: [2020, 2018, 2016, 2014, 2012, 2010, 2008]
    })
    .reply(code, retval)
}

function mockMaplightDownload(payload) {
  return nock('https://search.maplight.org')
    .get(/maplight-api\/csv_downloads\/(.*)/)
    .reply(200, payload)
}

function mockGoogleCivic(opts) {
  const {
    retval,
    code = 200
  } = opts

  return nock('https://www.googleapis.com')
    .get(/\/civicinfo\/v2\/representatives\/(.+)/)
    .query({
      key: /.+/,
      levels: 'country',
      fields: 'officials(name,party)'
    })
    .reply(code, retval)
}

function failRequest({
  url,
  message = 'Total request failure'
}) {
  return nock(url)
    .get(/.*/)
    .replyWithError({
      message,
      code: 500
    })
}
