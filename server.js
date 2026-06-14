const express = require('express');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// QR code generation endpoint
app.get('/api/qrcode', async (req, res) => {
  try {
    const text = req.query.text;
    if (!text) {
      return res.status(400).send('Missing "text" query parameter');
    }
    
    // Generate QR code as image buffer
    const buffer = await qrcode.toBuffer(text, {
      margin: 1,
      width: 512,
      color: {
        dark: '#0f172af0',  // Dark slate
        light: '#ffffff'    // White background for scannability
      }
    });
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('QR code generation error:', err);
    res.status(500).send('Error generating QR code');
  }
});

// Helper function to find the local IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal loopbacks and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Start Server on 0.0.0.0 to allow access from local network (mobile devices)
app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  const localUrl = `http://localhost:${PORT}`;
  const networkUrl = `http://${localIp}:${PORT}`;
  
  console.log('\n==================================================');
  console.log(`🐉 LOREBEAST PORTAL SERVER STARTED 🐉`);
  console.log(`Local Access:   ${localUrl}`);
  console.log(`Network Access: ${networkUrl}`);
  console.log('==================================================');
  console.log(`Scan the QR code below to connect your mobile device:`);
  
  qrcodeTerminal.generate(networkUrl, { small: true }, (qrcodeStr) => {
    console.log(qrcodeStr);
  });
  console.log('==================================================\n');
});
