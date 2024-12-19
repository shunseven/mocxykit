import express from 'express';
import ngrok from 'ngrok';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/express-proxy-mock/enable-public-access', async (req, res) => {
  try {
    const port = req.socket.localPort;
    const url = await ngrok.connect({
      addr: port,
      // 如果有 ngrok authtoken，在这里添加
      // authtoken: 'your_ngrok_auth_token'
    });
    
    res.json({
      success: true,
      url
    });
  } catch (error) {
    console.error('Ngrok error:', error);
    res.json({
      success: false,
      error: 'Failed to enable public access'
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
