// backend/server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { scrapeBlazeHistory } = require('./scraper');

const app = express();
app.use(cors());

// Usa a porta fornecida pelo Render ou a 3001 como padrão
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let lastKnownHistory = [];

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on('connection', ws => {
  console.log('✅ Cliente conectado via WebSocket.');
  if (lastKnownHistory.length > 0) {
    ws.send(JSON.stringify(lastKnownHistory));
  }
  ws.on('close', () => {
    console.log('❌ Cliente desconectado.');
  });
});

app.get('/api/history', async (req, res) => {
    console.log('Recebida requisição para carga inicial de dados.');
    const history = await scrapeBlazeHistory();
    if (history && history.length > 0) {
        lastKnownHistory = history;
        res.json(history.slice(0, 200)); // Envia o máximo para a carga inicial
    } else {
        res.status(500).json({ error: 'Falha ao buscar o histórico inicial.' });
    }
});

const updateInterval = 20 * 1000; // 20 segundos
setInterval(async () => {
  console.log('---------------------------------');
  console.log('Buscando por atualizações...');
  
  const newHistory = await scrapeBlazeHistory();

  if (newHistory && newHistory.length > 0 && lastKnownHistory.length > 0 && newHistory[0].fullDate !== lastKnownHistory[0].fullDate) {
    console.log('✨ Novos dados encontrados! Transmitindo para os clientes...');
    lastKnownHistory = newHistory;
    broadcast(JSON.stringify(newHistory));
  } else if (lastKnownHistory.length === 0 && newHistory && newHistory.length > 0) {
    // Caso especial: se o primeiro scrape no intervalo for bem-sucedido
    console.log('✨ Dados iniciais encontrados! Transmitindo para os clientes...');
    lastKnownHistory = newHistory;
    broadcast(JSON.stringify(newHistory));
  } else {
    console.log('Nenhuma atualização encontrada.');
  }
}, updateInterval);

server.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP e WebSocket rodando na porta ${PORT}`);
});