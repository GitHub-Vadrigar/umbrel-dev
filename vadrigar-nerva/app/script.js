function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active-nav"));
  if (event) event.currentTarget.classList.add("active-nav");
}

// SAFE RPC
async function rpc(method, params = {}) {
  try {
    const res = await fetch("/json_rpc", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "0",
        method,
        params
      })
    });
    return await res.json();
  } catch {
    return null;
  }
}

// DIRECT HTTP RPC (mining commands)
async function rpcDirect(endpoint, body = {}) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch {
    return null;
  }
}

// CHECK FOR UPDATES
async function checkForUpdates(currentVersion) {
  try {
    const res = await fetch("https://api.github.com/repos/nerva-project/nerva/releases/latest");
    if (!res.ok) return;
    const data = await res.json();
    const latestVersion = data.tag_name.replace(/[vV]/g, '');
    const cleanCurrent = currentVersion.replace(/[vV]/g, '');

    if (cleanCurrent !== latestVersion && !cleanCurrent.startsWith(latestVersion)) {
      const icon = document.getElementById("updateIcon");
      const text = document.getElementById("updateTooltipText");
      if (icon && text) {
        icon.style.display = "inline-block";
        text.innerText = `New Nerva Deamon version available: v${latestVersion}. This update will be included in the next app release.`;
      }
    }
  } catch (e) {
    console.error("Update check failed", e);
  }
}

// HELPERS
function formatTime(seconds) {
  if (seconds === Infinity || isNaN(seconds) || seconds < 0) return "Calculating...";
  if (seconds === 0) return "Synced";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatHashrate(hashes) {
  if (hashes === 0) return '0 H/s';
  const k = 1000;
  const sizes = ['H/s', 'kH/s', 'MH/s'];
  const i = Math.floor(Math.log(hashes) / Math.log(k));
  return parseFloat((hashes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// OVERVIEW & BLOCKCHAIN
let lastHeight = 0;
let lastTime = Date.now();

async function updateOverview() {
  const data = await rpc("get_info");
  const badge = document.getElementById("statusBadge");
  const statusText = document.getElementById("statusText");

  if (!data || !data.result) {
    if (badge) badge.className = "status-badge status-offline";
    if (statusText) statusText.innerText = "Offline";
    return;
  }

  const r = data.result;

  if (badge) badge.className = "status-badge status-online";
  if (statusText) statusText.innerText = "Online";
  if (r.version) {
    document.getElementById("coreVersion").innerText = "Nerva Daemon v" + r.version;
    if (!window.updateCheckDone) {
      checkForUpdates(r.version);
      window.updateCheckDone = true;
    }
  }

  const netHashrate = r.difficulty ? r.difficulty / 60 : 0;
  document.getElementById("netHash").innerText = formatHashrate(netHashrate);
  document.getElementById("dbSize").innerText = r.database_size ? formatBytes(r.database_size) : "-";
  document.getElementById("peerCount").innerText = (r.incoming_connections_count || 0) + (r.outgoing_connections_count || 0);
  document.getElementById("difficulty").innerText = formatNumber(r.difficulty || 0);
  
  const txPoolCount = r.tx_pool_size || 0;
  document.getElementById("mempool").innerText = txPoolCount + (txPoolCount === 1 ? " TX" : " TXs");
  document.getElementById("mempoolTooltip").innerText = txPoolCount + " transactions in mempool";

  const actualHeight = r.height || 0;
  const targetHeight = r.target_height || 0;
  
  const syncEl = document.getElementById("syncText");
  const progressEl = document.getElementById("progress");
  const etaEl = document.getElementById("eta");

  if (targetHeight === 0 || (actualHeight === 0 && targetHeight === 0)) {
    syncEl.innerHTML = "Connecting to network...";
    progressEl.style.width = "0%";
    etaEl.innerText = "Waiting for peers...";
  } 
  else if (actualHeight < targetHeight) {
    let percent = ((actualHeight / targetHeight) * 100).toFixed(2);
    let tooltipText = `Height: ${formatNumber(actualHeight)} / ${formatNumber(targetHeight)}`;
    let tooltipHTML = `<span class="tooltip-container">i<span class="tooltip-text">${tooltipText}</span></span>`;
    
    syncEl.innerHTML = percent + "% synced " + tooltipHTML;
    progressEl.style.width = percent + "%";
    
    const now = Date.now();
    const deltaH = actualHeight - lastHeight;
    const deltaT = (now - lastTime) / 1000;
    
    if (deltaH > 0) {
      const speed = deltaH / deltaT;
      const remaining = targetHeight - actualHeight;
      etaEl.innerText = formatTime(Math.floor(remaining / speed));
    } else {
      etaEl.innerText = "Calculating ETA...";
    }
  } 
  else {
    let tooltipText = `Net height: ${formatNumber(actualHeight)}`;
    let tooltipHTML = `<span class="tooltip-container">i<span class="tooltip-text">${tooltipText}</span></span>`;
    
    syncEl.innerHTML = "100.00% synced " + tooltipHTML;
    progressEl.style.width = "100%";
    etaEl.innerText = "Synced";
  }

  if (actualHeight > lastHeight) {
    lastHeight = actualHeight;
    lastTime = Date.now();
  }

  updateRecentBlocks(actualHeight);
}

// RECENT BLOCKS
async function updateRecentBlocks(currentHeight) {
  if (currentHeight <= 0) return;
  
  const start = Math.max(0, currentHeight - 6);
  const data = await rpc("get_block_headers_range", {
    start_height: start,
    end_height: currentHeight - 1
  });

  if (!data || !data.result || !data.result.headers) return;

  let html = "";
  const blocks = data.result.headers.reverse().slice(0, 6);

  blocks.forEach(b => {
    html += `
      <div class="block-square">
        <div class="block-number">${formatNumber(b.height)}</div>
        <div class="block-info">
          <span>TXs: <strong>${b.num_txes}</strong></span>
          <span>Size: <strong>${formatBytes(b.block_size || 0)}</strong></span>
          <span>Found: <strong>${timeAgo(b.timestamp)}</strong></span>
        </div>
      </div>
    `;
  });

  const row = document.getElementById("blocksRow");
  if (row) row.innerHTML = html;
}

// PEERS & MINING
const ipCache = {};
let currentSortColumn = 'address';
let currentSortDirection = 'asc';

function changeSort(column) {
  if (currentSortColumn === column) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortColumn = column;
    currentSortDirection = column === 'height' ? 'desc' : 'asc';
  }
  updateSortHeaders();
  updatePeers();
}

function updateSortHeaders() {
  const headers = {
    address: document.getElementById('th-address'),
    direction: document.getElementById('th-direction'),
    height: document.getElementById('th-height')
  };
  
  if (!headers.address || !headers.direction || !headers.height) return;

  headers.address.innerText = 'Peer / IP';
  headers.direction.innerText = 'Direction';
  headers.height.innerText = 'Height';

  const arrow = currentSortDirection === 'asc' ? ' ▲' : ' ▼';
  headers[currentSortColumn].innerText += arrow;
}

async function getCountryFlag(ip) {
  if (ip.endsWith('.onion') || ip.includes('.onion')) {
    return `<span style="background: #7D4698; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 3px; margin-right: 8px; vertical-align: middle;">TOR</span>`;
  }
  
  if (ipCache[ip]) return ipCache[ip];
  try {
    const res = await fetch(`https://get.geojs.io/v1/ip/country/${ip}.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const countryCode = data.country.toLowerCase();
    const flagHTML = `<img src="https://flagcdn.com/w20/${countryCode}.png" style="width: 20px; vertical-align: middle; margin-right: 8px; border-radius: 2px;" alt="${data.country}">`;
    ipCache[ip] = flagHTML;
    return flagHTML;
  } catch {
    const fallback = `<span style="display:inline-block; width:20px; margin-right:8px; text-align:center;">🏳️</span>`;
    ipCache[ip] = fallback;
    return fallback;
  }
}

async function updatePeers() {
  const data = await rpc("get_connections");
  if (!data || !data.result || !data.result.connections) return;

  const connections = data.result.connections;
  
  const ipPromises = connections.map(async (p) => {
    let cleanIp = p.address.split(':')[0];
    if (cleanIp.startsWith('[')) {
      cleanIp = cleanIp.substring(1, cleanIp.indexOf(']'));
    }
    const flag = await getCountryFlag(cleanIp);
    return { ...p, flag };
  });

  const enrichedPeers = await Promise.all(ipPromises);

  enrichedPeers.sort((a, b) => {
    let valA, valB;

    if (currentSortColumn === 'address') {
      valA = a.address.toLowerCase();
      valB = b.address.toLowerCase();
    } else if (currentSortColumn === 'direction') {
      valA = a.incoming ? 'in' : 'out';
      valB = b.incoming ? 'in' : 'out';
    } else if (currentSortColumn === 'height') {
      valA = a.height || 0;
      valB = b.height || 0;
    }

    if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  let html = "";
  enrichedPeers.forEach(p => {
    html += `<tr><td>${p.flag}${p.address}</td><td>${p.incoming ? "IN" : "OUT"}</td><td>${formatNumber(p.height)}</td></tr>`;
  });
  
  const tableBody = document.getElementById("peerTable");
  if (tableBody) {
    tableBody.innerHTML = html || "<tr><td colspan='3'>No peers.</td></tr>";
  }
}

async function updateMiningStatus() {
  const data = await rpcDirect("/mining_status");
  const statusEl = document.getElementById("miningStatus");
  if (!statusEl) return;

  if (data && data.status === "OK") {
    statusEl.innerText = data.active ? `Active (${data.threads_count} threads)` : "Idle";
    statusEl.style.color = data.active ? "#2ea043" : "#8b949e";
    document.getElementById("miningSpeed").innerText = formatHashrate(data.speed || 0);
    document.getElementById("miningTarget").innerText = data.address || "-";
  }
}

async function startMining() {
  const addr = document.getElementById("mineAddress").value.trim();
  const threads = parseInt(document.getElementById("mineThreads").value) || 1;
  if (!addr) return alert("Enter address");
  
  localStorage.setItem("nerva_wallet", addr);
  const res = await rpcDirect("/start_mining", { miner_address: addr, threads_count: threads });
  if (res && res.status === "OK") updateMiningStatus();
  else alert("Error starting mining. Is the node synced?");
}

async function stopMining() {
  await rpcDirect("/stop_mining");
  updateMiningStatus();
}

// INIT
function initializeSettings() {
  const host = window.location.hostname;
  const nodeDisp = document.getElementById("nodeIpDisplay");
  if (nodeDisp) nodeDisp.innerText = `${host}:17566`;

  const savedWallet = localStorage.getItem("nerva_wallet");
  if (savedWallet) document.getElementById("mineAddress").value = savedWallet;
}

async function pollData() {
  await updateOverview();
  await updatePeers();
  await updateMiningStatus();
  setTimeout(pollData, 5000);
}

initializeSettings();
pollData();