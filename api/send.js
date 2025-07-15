import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

const getAccessToken = async () => {
  const jwtClient = new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    SCOPES
  );
  const tokens = await jwtClient.authorize();
  return tokens.access_token;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { topic, token, data } = req.body;
  if (!topic && !token) {
    return res.status(400).json({ error: 'Must provide topic or token' });
  }

  try {
    const accessToken = await getAccessToken();

    const message = {
      message: {
        android: { priority: 'high' },
        ...(topic ? { topic } : { token }),
        data
      }
    };

    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${process.env.PROJECT_ID}/messages:send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
