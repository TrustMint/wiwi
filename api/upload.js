
import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

// Disable Vercel's default body parser to handle file streams manually
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Parse the incoming form data containing the file
    const data = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Handle file object structure (depends on formidable version/config)
    const fileObj = data.files.file;
    const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 2. Prepare FormData for Pinata
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.filepath));
    
    // Add metadata for Pinata (helps you identify files in their dashboard)
    // FIX: Added "DeMarket Asset -" prefix and timestamp for easier finding in Pinata UI
    const originalName = file.originalFilename || 'unknown_file';
    const cleanName = `DeMarket Asset - ${originalName} (${new Date().toISOString().split('T')[0]})`;
    
    const metadata = JSON.stringify({
      name: cleanName,
    });
    formData.append('pinataMetadata', metadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', pinataOptions);

    // 3. Send to Pinata using the JWT from environment variables
    // IMPORTANT: Ensure PINATA_JWT is set in Vercel Project Settings
    const pinataJWT = process.env.PINATA_JWT;
    
    if (!pinataJWT) {
       console.error('PINATA_JWT is missing in environment variables');
       return res.status(500).json({ error: 'Server misconfiguration: Missing IPFS credentials' });
    }

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
        ...formData.getHeaders()
      }
    });

    // 4. Return the result to the frontend
    const ipfsHash = response.data.IpfsHash;
    // Use a public gateway or Pinata's gateway
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return res.status(200).json({ 
      success: true, 
      ipfsHash: ipfsHash,
      ipfsUrl: ipfsUrl 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
