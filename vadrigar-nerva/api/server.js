const express = require('express');
const fs = require('fs');
const http = require('http');

const app = express();
app.use(express.json());

const CONFIG_PATH = '/data/nerva/settings.conf';
const DOCKER_SOCKET = '/var/run/docker.sock';
const TARGET_CONTAINER = 'vadrigar-nerva_nervad_1';

app.get('/api/settings', (req, res) => {
    if (!fs.existsSync(CONFIG_PATH)) {
        return res.json({});
    }

    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const lines = content.split('\n');
    const config = {};

    lines.forEach(line => {
        const match = line.match(/^([^=]+)="([^"]*)"/);
        if (match) {
            config[match[1]] = match[2];
        }
    });

    res.json(config);
});

app.post('/api/settings', (req, res) => {
    const body = req.body;
    let content = '';

    for (const [key, value] of Object.entries(body)) {
        content += `${key}="${value}"\n`;
    }

    fs.writeFileSync(CONFIG_PATH, content, 'utf8');

    const dockerRequest = http.request({
        socketPath: DOCKER_SOCKET,
        path: `/containers/${TARGET_CONTAINER}/restart`,
        method: 'POST'
    }, (dockerRes) => {
        if (dockerRes.statusCode === 204) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    });

    dockerRequest.on('error', () => {
        res.sendStatus(500);
    });

    dockerRequest.end();
});

app.listen(3000, () => {
    console.log('API listening on port 3000');
});