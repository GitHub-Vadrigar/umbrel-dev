const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const SETTINGS_FILE = '/data/nerva/settings.conf';

// Check of de setup al is doorlopen
app.get('/api/setup-status', (req, res) => {
    if (fs.existsSync(SETTINGS_FILE)) {
        res.json({ setupComplete: true });
    } else {
        res.json({ setupComplete: false });
    }
});

// Sla de instellingen op
app.post('/api/save-setup', (req, res) => {
    const useQuicksync = req.body.useQuicksync === true ? "true" : "false";
    
    // Voeg hier in de toekomst je andere variabelen aan toe
    const content = `USE_QUICKSYNC="${useQuicksync}"\n`;
    
    fs.writeFileSync(SETTINGS_FILE, content);
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log('Nerva API luistert op poort 3000');
});