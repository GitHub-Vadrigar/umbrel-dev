const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

const flagPath = '/data/nerva/tor_enabled.flag';

app.post('/toggle-tor', (req, res) => {
  const { enableTor } = req.body;

  if (enableTor) {
    fs.writeFileSync(flagPath, '1');
  } else {
    if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath);
  }

  exec("docker restart $(docker ps -q -f name=nervad)", (error) => {
    if (error) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.listen(3000);