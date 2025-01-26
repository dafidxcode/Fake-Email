export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      // Lakukan permintaan GET ke API inbox
      const response = await fetch(
        `https://api.paxsenix.biz.id/tempmail/inbox?email=${email}`,
        {
          method: 'GET',
          headers: {
            'accept': '*/*'
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        res.status(200).json(data);
      } else {
        res.status(response.status).json({
          message: 'Failed to fetch inbox',
          error: data
        });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
