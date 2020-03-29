# Campaign Contributions

This project combines Google's Civic Information API and Maplight data to
provide an aggregated list of contributions for each party.

# Running the program

* First, `npm install`, then...
* `npm start -- --api_key=[The required API key]` - Execute the program
  for all 50 states.  **Use a fast Internet connection.**
* `npm run test` - Run the test suite, which provides a coverage report

# Program Flow

Goggle's Civic data only applies to politicians that are currently holding
office.  Maplight has historical data, but only for President and Congressional
members.  The Civic data is limited by "divisions" of the country, so to
get data for all parties, one must first find all `country`-level offices
and the names of those that occupy them, so for this, we can query by state
as the division.  From there, we can use Maplight.

* Use a static JSON file of all 50 states to query Google for upper-level
  positions (and names).  Use their `fields` filtering to reduce data transfer.
  Gather all names and party affiliations into a single array.

* Iterate through the candidates, and start a process for each one that will:
  * Contact Maplight's name search to try and find matching records for the
    given name.  Middle initials and suffixes are left out for better accuracy.
    Manual intervention will be needed for failed matches like
    "Tom" versus "Thomas" and "Bernie" versus "Bernard".
  * Call Maplight's download API to have them ready a CSV file of all
    contribution matches for the given maplight ID.
  * Download the CSV file that they prepared on the server.  Using streams,
    emit each row to an aggregator function.
  * Fire `done` when the CSV file is fully processed
  * Dump the results to STDOUT

# Challenges

* The amount of data needed for this is pretty staggering, **however**, it is the
only way to ensure that the results are as accurate as possible.  
Maplight's "bulk data" API only provides 50 rows, so this kills the ability to
calculate an accurate `min`, `max` and `avg` values.  Programmatically
downloading all rows seemed to be the only way to get the full data set needed
to compute the desired result.

* Dealing with so many APIs creates a problem with constant iteration and
blocking the event loop.  To avoid this, use an event flow that keeps things
asynchronous, and use streams when downloading and processing data rather than
awaiting the full result and chewing up memory.
