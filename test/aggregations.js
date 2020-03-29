'use strict'

const {test, threw} = require('tap')
const common = require('./common.js')
const aggregations = require('../lib/aggregations.js')

const person = {
  name: 'Jack Burton',
  party: 'Pork Chop Express Party',
  maplight: {
    CandidateName: 'Jack Burton',
    CandidateMaplightID: 1234
  },
  csv_file: 'https://search.maplight.org/maplight-api/csv_downloads/xxx.csv'
}

test('aggregate', async (t) => {
  t.test('Initialize', async (tt) => {
    aggregations.initialize(person)
    const party = aggregations.getPartyContributions()
    const individual = aggregations.getIndividualContributions()
    tt.equal(typeof party, 'object')
    tt.deepEqual(party.get('Pork Chop Express Party'), {
      min: 0,
      max: 0,
      avg: 0,
      total: 0,
      contribution_count: 0
    }, 'Party contributions result initialized')
    tt.deepEqual(individual.get('Jack Burton'), {
      total: 0,
      contribution_count: 0
    })
  })

  t.test('CSV headers do not crash it', async (tt) => {
    const input = {
      person,
      contribution: ['xx', 'xx', 'xx']
    }
    aggregations.aggregate(input)
    tt.deepEqual(aggregations.getIndividualContributions().get('Jack Burton'), {
      total: 0,
      contribution_count: 0
    })
  })

  t.test('Min gets set properly first time', async (tt) => {
    const input = {
      person,
      contribution: ['xx', 'xx', '10']
    }
    aggregations.aggregate(input)
    const party = aggregations.getPartyContributions()
    tt.deepEqual(party.get('Pork Chop Express Party'), {
      min: 10,
      max: 10,
      avg: 10,
      total: 10,
      contribution_count: 1
    })
  })

  t.test('Max gets set properly first time', async (tt) => {
    const input = {
      person,
      contribution: ['xx', 'xx', '555']
    }
    aggregations.aggregate(input)
    const party = aggregations.getPartyContributions()
    tt.deepEqual(party.get('Pork Chop Express Party'), {
      min: 10,
      max: 555,
      avg: '282.50',
      total: '565.00',
      contribution_count: 2
    })
  })

  t.test('Handles negative values', async (tt) => {
    const input = {
      person,
      contribution: ['xx', 'xx', '-10']
    }
    aggregations.aggregate(input)
    const party = aggregations.getPartyContributions()
    tt.deepEqual(party.get('Pork Chop Express Party'), {
      min: 10,
      max: 555,
      avg: '185.00',
      total: '555.00',
      contribution_count: 3
    })
  })

  t.test('Min gets set properly subsequent times', async (tt) => {
    const input = {
      person,
      contribution: ['xx', 'xx', '3']
    }
    aggregations.aggregate(input)
    const party = aggregations.getPartyContributions()
    tt.deepEqual(party.get('Pork Chop Express Party'), {
      min: 3,
      max: 555,
      avg: '139.50',
      total: '558.00',
      contribution_count: 4
    })
  })

  t.test('Max gets set properly subsequent times', async (tt) => {
    const input = {
      person,
      contribution: ['xx', 'xx', '999']
    }
    aggregations.aggregate(input)
    const party = aggregations.getPartyContributions()
    tt.deepEqual(party.get('Pork Chop Express Party'), {
      min: 3,
      max: 999,
      avg: '311.40',
      total: '1557.00',
      contribution_count: 5
    })
  })
}).catch(threw)
