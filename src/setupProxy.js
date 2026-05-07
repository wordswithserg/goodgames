const fetch = require('node-fetch');

module.exports = function (app) {
  app.use(require('express').json());

  app.post('/api/igdb', async (req, res) => {
    try {
      const clientId = process.env.REACT_APP_IGDB_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_IGDB_CLIENT_SECRET;

      const tokenRes = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        { method: 'POST' }
      );
      const { access_token } = await tokenRes.json();
      if (!access_token) return res.status(500).json({ error: 'Failed to get IGDB token' });

      const { endpoint, body } = req.body;
      const igdbRes = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'text/plain',
        },
        body,
      });

      res.json(await igdbRes.json());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
