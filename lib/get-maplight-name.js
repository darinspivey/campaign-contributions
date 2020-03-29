const request = require('request')
const controller = require('./emitter-controller.js')

const SPACES_RE = /\s+/
const CONTAINS_DOT = /\./
const SAME_NAME_SUFFIX = /^i+$/i
// Just illustrating how manual fixes could work. These would be in a DB.
const MANUAL_MATCHES = new Map([
  ['tom cotton', {
    CandidateName: 'Thomas Cotton'
    , CandidateMaplightID: 6192
  }],
  ['mike crapo', {
    CandidateName: 'Michael Crapo',
    CandidateMaplightID: 4553
  }],
  ['mike rounds', {
    CandidateName: 'Marion Michael Rounds',
    CandidateMaplightID: 10556
  }]
])
/**
 * Attempts to match Google Civic person names to Maplight's normalized
 * names.  Maplight's data differs quite a bit, so this will use their
 * `candidate_names` API to provide possible matches.
 * @param  {Object} person - Contains information about a candidate
 * @param  {String} person.name - Google's verion of their full name
 * @param  {String} person.party - Their political party
 * @return {undefined}
 * @emits prepare_csv_download - A successful name match will next attempt
 *   to download data
 * @emits name_match_failed - If a name match cannot be made
 * @emits error - Unexpected errors
 */
module.exports = function getMaplightName(person) {
  const {name} = person

  const manual = MANUAL_MATCHES.get(name.toLowerCase())
  if (manual) {
    controller.emit('prepare_csv_download', {
      ...person,
      maplight: manual
    })
    return
  }
  const search_names = _getSearchName(name)
  const full_name = search_names.join(' ')

  request({
    url: 'https://search.maplight.org/maplight-api/fec/candidate_names/'
      + encodeURIComponent(full_name),
    json: true,
  }, (err, res, body) => {
    if (err) {
      controller.emit('error', err)
      return
    }
    const possibilities = body.data.candidate_names
    if (!possibilities.length) {
      const err = new Error('Candidate name search returned nothing!')
      err.meta = {search_names}
      controller.emit('error', err)
      return
    }

    for (const maplight of possibilities) {
      const ml_name = maplight.CandidateName
      const approx_match_re = new RegExp(
        `${search_names[0]}.*?${search_names[1]}`,
        'i'
      )
      if (approx_match_re.test(ml_name)) {
        controller.emit('prepare_csv_download', {
          ...person,
          maplight
        })
        return
      }
    }
    const error = new Error('First and Last name match failed')
    error.meta = {
      search_names,
      possibilities: JSON.stringify(possibilities, null, 2)
    }
    controller.emit('name_match_failed', error)
  })
}

/**
 * Attempt to strip Civic names down to a first/last name.  This will provide
 * broader matches with Maplight data.  Get rid of all middle initials and
 * suffixes
 * @param {String} civic_name - The person's full name as seen in Google
 * @return {String[]} search_names - Array of first and last name
 */
function _getSearchName(civic_name) {
  // Get as close to first & last names if possible (eliminate suffixes)
  const parts = civic_name.split(SPACES_RE)
  const search_names = parts.reduce((acc, str) => {
    if (!CONTAINS_DOT.test(str) && !SAME_NAME_SUFFIX.test(str)) {
      acc.push(str)
    }
    return acc
  }, [])

  if (search_names.length > 2) {
    // Scrap anyone's full middle name
    return [search_names[0], search_names[search_names.length - 1]]
  }
  return search_names
}
