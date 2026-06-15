const express = require('express');
const fs = require('fs');
const http = require('http');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const CONFIG_PATH = '/data/nerva/settings.conf';
const DOCKER_SOCKET = '/var/run/docker.sock';
const TARGET_CONTAINER = 'vadrigar-nerva_nervad_1';

function restartContainer(containerName) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            socketPath: DOCKER_SOCKET,
            path: `/containers/${containerName}/restart?t=15`,
            method: 'POST',
            headers: {
                'Host': 'localhost',
                'Content-Type': 'application/json'
            }
        }, (res) => {
            if (res.statusCode === 204) {
                resolve();
            } else {
                reject(new Error(`Docker API Error ${res.statusCode}`));
            }
        });
        req.on('error', reject);
        req.end();
    });
}

// --- WIZARD ROUTES ---
app.get('/api/setup-status', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ setupComplete: fs.existsSync(CONFIG_PATH) });
});

app.post('/api/save-setup', (req, res) => {
    const defaults = {
		USE_QUICKSYNC: req.body.useQuicksync === true ? "true" : "false",
        PRIORITY_NODE: "",
		EXCLUSIVE_NODE: "",
        LOG_LEVEL: "0",
        DISABLE_UPNP: "false",
        NO_ANALYTICS: "false",
		HIDE_PORT: "false"
    };

    let content = '';
    
    for (const [key, value] of Object.entries(defaults)) {
        content += `${key}="${value}"\n`;
    }

    fs.writeFileSync(CONFIG_PATH, content);
    
    res.json({ success: true });
});

// --- SETTINGS TAB ROUTES ---
app.get('/api/settings', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    
    if (!fs.existsSync(CONFIG_PATH)) {
        return res.json({});
    }

    try {
        const content = fs.readFileSync(CONFIG_PATH, 'utf8');
        const lines = content.split(/\r?\n/);
        const config = {};

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;

            const equalIndex = trimmedLine.indexOf('=');
            if (equalIndex > -1) {
                const key = trimmedLine.substring(0, equalIndex).trim();
                let value = trimmedLine.substring(equalIndex + 1).trim();

                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.substring(1, value.length - 1);
                }
                config[key] = value;
            }
        });

        res.json(config);
    } catch (err) {
        console.error("Failed to parse config file:", err);
        res.status(500).json({ error: "Failed to read settings file" });
    }
});

app.post('/api/settings', (req, res) => {
    const body = req.body;
    let content = '';

    for (const [key, value] of Object.entries(body)) {
        content += `${key}="${value}"\n`;
    }

    try {
        fs.writeFileSync(CONFIG_PATH, content, 'utf8');

        const lockFile = '/data/nerva/.download_complete';
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }

        res.sendStatus(200);

        console.log("Triggering background sync process...");
        
        exec('sh /app/download.sh', (error, stdout, stderr) => {
            if (error) {
                console.error(`Download script error: ${error.message}`);
            }
            if (stderr) {
                console.error(`Download script stderr: ${stderr}`);
            }
            
            console.log("Download process finished. Restarting Nervad daemon...");
            
            restartContainer(TARGET_CONTAINER).then(() => {
                console.log(`${TARGET_CONTAINER} restarted successfully.`);
            }).catch(err => {
                console.error(`Failed to restart ${TARGET_CONTAINER}:`, err.message);
            });
        });

    } catch (error) {
        console.error("API Error during settings save:", error);
        if (!res.headersSent) {
            res.sendStatus(500);
        }
    }
});

app.listen(3000, () => {
    console.log('Nerva API running on port 3000');
});