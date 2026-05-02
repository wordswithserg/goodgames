const fetch = require('node-fetch')

exports.handler = async function (event) {
  const clientId = process.env.REACT_APP_IGDB_CLIENT_ID
  const clientSecret = process.env.REACT_APP_IGDB_CLIENT_SECRET

  // Get Twitch access token
  const tokenRes = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  if (!accessToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get access token', detail: tokenData }),
    }
  }

  // Forward the request body to IGDB
  const { endpoint, body } = JSON.parse(event.body)

  const igdbRes = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/plain',
    },
    body,
  })

  const data = await igdbRes.json()

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
}
