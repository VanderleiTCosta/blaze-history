// backend/server.js (VERSÃO CORRIGIDA E FINAL)
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { scrapeBlazeHistory } = require('./scraper');

const app = express();

// Lista de permissões para o CORS funcionar localmente E no deploy
const allowedOrigins = [
  'https://blaze-history-frontend.onrender.com', // Sua URL de produção
  'http://localhost:5173'                         // Sua URL de desenvolvimento local
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // Permite a requisição
    } else {
      callback(new Error('Não permitido pela política de CORS')); // Bloqueia
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let lastKnownHistory = [];
let isScraping = false; // "Trava" para impedir buscas simultâneas

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

// Rota HTTP que NÃO dispara mais o scraper, apenas entrega os dados já existentes
app.get('/api/history', (req, res) => {
    console.log('Recebida requisição para carga inicial de dados.');
    if (lastKnownHistory.length > 0) {
        console.log('Enviando histórico do cache.');
        res.json(lastKnownHistory.slice(0, 200));
    } else {
        // Se ainda não temos dados, avisamos o frontend para aguardar o WebSocket.
        res.status(202).json({ message: 'Servidor está buscando os dados iniciais. Aguarde a atualização via WebSocket.' });
    }
});

// Função centralizada e segura para rodar o scraper
const runScrape = async () => {
    if (isScraping) {
        console.log('Scrape já em andamento, pulando esta execução.');
        return;
    }

    isScraping = true;
    console.log('---------------------------------');
    console.log('Buscando por atualizações...');

    try {
        const newHistory = await scrapeBlazeHistory();
        if (newHistory && newHistory.length > 0) {
            if (lastKnownHistory.length === 0 || newHistory[0].fullDate !== lastKnownHistory[0].fullDate) {
                console.log('✨ Novos dados encontrados! Transmitindo...');
                lastKnownHistory = newHistory;
                broadcast(JSON.stringify(newHistory));
            } else {
                console.log('Nenhuma atualização encontrada.');
            }
        }
    } catch (error) {
        console.error("Erro na função runScrape:", error.message);
    } finally {
        isScraping = false; // Garante que a trava seja liberada no final
        console.log('Ciclo de busca finalizado.');
    }
};

// Define o timer para chamar nossa função segura a cada 20 segundos
setInterval(runScrape, 20 * 1000);

// Executa o scrape uma vez, assim que o servidor liga, para ter os dados iniciais
runScrape();

server.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP e WebSocket rodando na porta ${PORT}`);
});