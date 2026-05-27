const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const SETTINGS_FILE = '/data/nerva/settings.conf';

app.get('/api/setup-status', (req, res) => {
    if (fs.existsSync(SETTINGS_FILE)) {
        res.json({ setupComplete: true });
    } else {
        res.json({ setupComplete: false });
    }
});

app.post('/api/save-setup', (req, res) => {
    const useQuicksync = req.body.useQuicksync === true ? "true" : "false";
    
    // Space for future settings expansion
    const content = `USE_QUICKSYNC="${useQuicksync}"\n`;
    
    fs.writeFileSync(SETTINGS_FILE, content);
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log('Nerva API listening on port 3000');
});