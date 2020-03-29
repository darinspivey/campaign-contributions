module.exports = {
  aggregate,
  getPartyContributions,
  getIndividualContributions,
  initialize,
  printTotals
}

const STATUS_COUNT = 100000
const party_contributions = new Map()
const individual_contributions = new Map()
let status_counter = 0
const RETVAL = [party_contributions, individual_contributions]

/**
 * aggregate a single row into the final result set by party. Results are
 * tracked by party, and also individually.
 * @param  {Object} person - Contains information about a candidate
 * @param  {String[]} contribution - A row of Maplight data for a person
 * @return {Map[]} - Returns the list of party and individual result maps
 */
function aggregate({person, contribution}) {
  const {name, party} = person
  const amount = Number(contribution[2])
  if (Number.isNaN(amount)) return // CSV headers

  const data = party_contributions.get(party)
  data.total = (Number(data.total) + amount).toFixed(2)
  data.contribution_count++
  if (amount > 0) {
    // Not sure what the negative numbers are, but it's not interesting
    // to have them as a `min`
    if (data.min === 0 || amount < data.min) data.min = amount
    if (data.max === 0 || amount > data.max) data.max = amount
  }
  // It might be a micro-optomization to only calculate avg at the end.  Not
  // sure it's worth the cost of iteration
  if (data.total > 0) {
    data.avg = Number(data.total / data.contribution_count).toFixed(2)
  }

  // Set these just for fun, and to check accuracy with Maplight totals
  const individual = individual_contributions.get(name)
  individual.total = (Number(individual.total) + amount).toFixed(2)
  individual.contribution_count++

  if (++status_counter % STATUS_COUNT === 0) {
    console.log(
      `Working....processed ${status_counter} rows`,
      party_contributions
    )
  }
  return RETVAL
}

/**
 * initialize the maps for use with parties and person names
 * @param  {Object} person - Contains information about a candidate
 * @return {undefined}
 */
function initialize(person) {
  const {name, party} = person

  individual_contributions.set(name, {
    total: 0,
    contribution_count: 0
  })

  if (party_contributions.has(party)) return
  party_contributions.set(party, {
    min: 0,
    max: 0,
    avg: 0,
    total: 0,
    contribution_count: 0
  })
}

/**
 * Getter for contributions by party.  Used in testing.
 * @return {Map<String,Object>} party_contributions - Keyed by party.
 *   Contains aggregations for min/max/avg/total.
 */
function getPartyContributions() {
  return party_contributions
}

/**
 * Getter for contributions by a person.  Used in testing.
 * @return {Map<String,Object>} party_contributions - Keyed by person name.
 *   Contains aggregations for min/max/avg/total.
 */
function getIndividualContributions() {
  return individual_contributions
}

/**
 * Prints the result maps for party and individuals to stdout
 * @return {undefined}
 */
function printTotals() {
  console.log('Peronal breakdown by politician', individual_contributions)
  console.log('Party totals are', party_contributions)
}
