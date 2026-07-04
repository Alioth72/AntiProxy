// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors()); // Allow requests from your React app
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

// Endpoint to send WhatsApp message
app.post('/send-whatsapp', async (req, res) => {
  const { to, body } = req.body;

  try {
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886', // Your Twilio Sandbox number
      to: `whatsapp:${to}`,           // User's number (must be joined to sandbox first)
      body: body
    });

    res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));