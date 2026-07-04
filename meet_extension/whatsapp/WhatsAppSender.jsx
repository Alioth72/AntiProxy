import React, { useState } from 'react';
import axios from 'axios';

const WhatsAppSender = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const sendWhatsApp = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const response = await axios.post('http://localhost:5000/send-whatsapp', {
        to: phoneNumber, // Format: +1234567890
        body: message
      });

      if (response.data.success) {
        setStatus(`Message sent! SID: ${response.data.sid}`);
        setMessage('');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus('Failed to send message.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>Send WhatsApp Message</h2>
      <form onSubmit={sendWhatsApp}>
        <div style={{ marginBottom: '10px' }}>
          <label>Recipient Number (e.g., +15550001234):</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hello from React!"
            required
            style={{ width: '100%', padding: '8px', minHeight: '80px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>
          Send Message
        </button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
};

export default WhatsAppSender;