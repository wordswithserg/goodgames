module.exports = async (req, res) => {
  const clientId = process.env.REACT_APP_IGDB_CLIENT_ID
  const clientSecret = process.env.REACT_APP_IGDB_CLIENT_SECRET

  const tokenRes = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  if (!accessToken) {
    return res.status(500).json({ error: 'Failed to get access token', detail: tokenData })
  }

  const { endpoint, body } = req.body

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
  res.status(200).json(data)
}
