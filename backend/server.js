// backend/server.js (VERSÃO COM CORS CORRIGIDO PARA DEPLOY)
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors'); // Continuamos precisando da biblioteca
const { scrapeBlazeHistory } = require('./scraper');

const app = express();

// --- CONFIGURAÇÃO DE CORS PARA PRODUÇÃO ---
// Esta é a parte que resolve o problema.
// Estamos dizendo ao servidor para aceitar requisições APENAS do seu site frontend.
const corsOptions = {
  origin: 'https://blaze-history-frontend.onrender.com',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // Usamos as opções que criamos
// -----------------------------------------

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
        res.json(history.slice(0, 200));
    } else {
        res.status(500).json({ error: 'Falha ao buscar o histórico inicial.' });
    }
});

const updateInterval = 20 * 1000;
setInterval(async () => {
  console.log('---------------------------------');
  console.log('Buscando por atualizações...');
  
  const newHistory = await scrapeBlazeHistory();

  if (newHistory && newHistory.length > 0 && lastKnownHistory.length > 0 && newHistory[0].fullDate !== lastKnownHistory[0].fullDate) {
    console.log('✨ Novos dados encontrados! Transmitindo para os clientes...');
    lastKnownHistory = newHistory;
    broadcast(JSON.stringify(newHistory));
  } else if (lastKnownHistory.length === 0 && newHistory && newHistory.length > 0) {
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