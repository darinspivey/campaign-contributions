const {promisify} = require('util')
const url = require('url')
const request = promisify(require('request'))
const controller = require('./emitter-controller.js')

const REP_PREFIX = 'https://www.googleapis.com/civicinfo/v2/representatives/'
const NOOP = []

/**
 * Uses Google Civic APIs to get state officials (congressional level) for
 * each state (using the whole state as a "division")
 * @param  {String} ocd_id - The division ID for Google's Civic API
 * @param  {String} api_key - The api key for the Google API
 * @return {Object[]} officials - Array of congressional people to search
 */
module.exports = async function getStateOfficials({ocd_id, api_key}) {
  const {body, req} = await request({
    url: REP_PREFIX + encodeURIComponent(ocd_id),
    json: true,
    qs: {
      key: api_key,
      levels: 'country',
      fields: 'officials(name,party)'
    }
  })

  if (body.error) {
    const u = url.parse(req.path, true)
    console.warn('There was an error in a response', {
      url: u.pathname,
      code: body.error.code,
      message: body.error.message
    })
    // Errors here can be somewhat ignored.  It shouldn't break the entire flow,
    // and since this is the "master list" for candidates, any failures will
    // just leave this state's data off.  These would be unexpected and could
    // be explicity handled if desired.
    return NOOP
  }
  return body.officials
}
