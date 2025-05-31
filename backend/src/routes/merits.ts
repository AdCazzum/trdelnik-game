const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();
const MERITS_API_URL = 'https://merits.blockscout.com/api/v1';

router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Get user info
    const userResponse = await fetch(`${MERITS_API_URL}/auth/user/${address}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!userResponse.ok) {
      return res.status(userResponse.status).json({ error: 'Failed to fetch user info' });
    }

    // Get leaderboard info
    const leaderboardResponse = await fetch(`${MERITS_API_URL}/leaderboard/users/${address}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!leaderboardResponse.ok) {
      return res.status(leaderboardResponse.status).json({ error: 'Failed to fetch leaderboard info' });
    }

    const leaderboardData = await leaderboardResponse.json();
    res.json(leaderboardData);
  } catch (error) {
    console.error('Error fetching Merits data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 