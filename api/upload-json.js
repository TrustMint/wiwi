
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const metadata = req.body;

    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({ error: 'Invalid metadata JSON' });
    }

    // Имя файла в Pinata (для удобства поиска в админке)
    const fileName = metadata.name 
      ? `metadata-${metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json` 
      : `metadata-${Date.now()}.json`;

    const pinataPayload = JSON.stringify({
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: fileName,
      },
      pinataContent: metadata
    });

    const pinataJWT = process.env.PINATA_JWT;

    if (!pinataJWT) {
        console.error('PINATA_JWT is missing');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', pinataPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pinataJWT}`
      }
    });

    const ipfsHash = response.data.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return res.status(200).json({
      success: true,
      ipfsHash: ipfsHash,
      ipfsUrl: ipfsUrl
    });

  } catch (error) {
    console.error('Metadata upload error:', error);
    return res.status(500).json({ error: 'Failed to upload metadata', details: error.message });
  }
}
