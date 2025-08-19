// backend/server.js (VERSÃO FINAL COM WEBSOCKET)
const express = require('express');
const http = require('http'); // Módulo http do Node
const WebSocket = require('ws'); // Biblioteca de WebSocket
const cors = require('cors');
const { scrapeBlazeHistory } = require('./scraper');

const app = express();
app.use(cors());

// Criamos um servidor HTTP tradicional usando o Express
const server = http.createServer(app);
// E atrelamos um servidor WebSocket a ele
const wss = new WebSocket.Server({ server });

let lastKnownHistory = [];

// Função para enviar dados para TODOS os clientes conectados
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Quando um novo cliente (navegador) se conectar...
wss.on('connection', ws => {
  console.log('✅ Cliente conectado via WebSocket.');

  // Envia o histórico mais recente assim que ele se conecta
  if (lastKnownHistory.length > 0) {
    ws.send(JSON.stringify(lastKnownHistory));
  }

  ws.on('close', () => {
    console.log('❌ Cliente desconectado.');
  });
});

// Endpoint para a PRIMEIRA carga de dados do frontend
app.get('/api/history', async (req, res) => {
    console.log('Recebida requisição para carga inicial de dados.');
    const history = await scrapeBlazeHistory();
    if (history && history.length > 0) {
        lastKnownHistory = history; // Atualiza nosso histórico "global"
        res.json(history.slice(0, 100)); // Envia apenas os 100 primeiros para a carga inicial
    } else {
        res.status(500).json({ error: 'Falha ao buscar o histórico inicial.' });
    }
});

// Timer principal no servidor para buscar atualizações
const updateInterval = 20 * 1000; // 20 segundos
setInterval(async () => {
  console.log('---------------------------------');
  console.log('Buscando por atualizações...');
  
  const newHistory = await scrapeBlazeHistory();

  // Compara o primeiro item do histórico novo com o antigo para ver se há mudança
  if (newHistory && newHistory.length > 0 && lastKnownHistory.length > 0 && newHistory[0].fullDate !== lastKnownHistory[0].fullDate) {
    console.log('✨ Novos dados encontrados! Transmitindo para os clientes...');
    lastKnownHistory = newHistory;
    broadcast(JSON.stringify(newHistory)); // Envia os novos dados para todos
  } else {
    console.log('Nenhuma atualização encontrada.');
  }
}, updateInterval);


// Inicia o servidor na porta 3001
server.listen(3001, () => {
    console.log(`🚀 Servidor HTTP e WebSocket rodando em http://localhost:3001`);
});