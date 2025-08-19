// frontend/src/App.jsx
import { useState, useEffect } from 'react';

const colorClasses = {
  red: 'bg-red-500 border-red-700 text-white',
  black: 'bg-gray-800 border-gray-900 text-white',
  white: 'bg-green-500 border-green-600 text-black',
};

// --- CONFIGURAÇÃO DAS URLs USANDO VARIÁVEIS DE AMBIENTE ---
// Em desenvolvimento, ele usará 'localhost'. Em produção (no Render), usará a URL que você configurou.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Converte a URL HTTP para o protocolo WebSocket (ws ou wss)
const WS_URL = API_URL.replace(/^http/, 'ws');
// -----------------------------------------------------------


function App() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [amountToShow, setAmountToShow] = useState(100);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        // Usa a variável API_URL para a busca inicial
        const response = await fetch(`${API_URL}/api/history`);
        if (!response.ok) throw new Error('Falha ao carregar dados iniciais. O servidor pode estar iniciando.');
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();

    // Usa a variável WS_URL para a conexão em tempo real
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Conectado ao servidor WebSocket');
      setConnectionStatus('Conectado em tempo real 🟢');
    };

    ws.onmessage = (event) => {
      const updatedHistory = JSON.parse(event.data);
      setHistory(updatedHistory);
      console.log('Histórico atualizado via WebSocket!');
    };

    ws.onclose = () => {
      console.log('Desconectado do servidor WebSocket');
      setConnectionStatus('Desconectado 🔴');
    };

    ws.onerror = (err) => {
        console.error('Erro no WebSocket:', err);
        setError('Erro na conexão em tempo real.');
        setConnectionStatus('Erro na conexão 🔴');
    }

    return () => {
      ws.close();
    };
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Histórico Blaze Double 🎲</h1>
          <p className="text-gray-400">Resultados mais recentes extraídos do Tipminer.</p>
        </header>
        
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-8 flex items-center justify-center gap-6">
            <div className="flex items-center gap-4">
                <span className="font-bold">Mostrar:</span>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="amount" value={100} checked={amountToShow === 100} onChange={() => setAmountToShow(100)} className="form-radio h-5 w-5 text-blue-500"/>100</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="amount" value={200} checked={amountToShow === 200} onChange={() => setAmountToShow(200)} className="form-radio h-5 w-5 text-blue-500"/>200</label>
            </div>
            <div className="text-sm text-gray-400">{connectionStatus}</div>
        </div>

        {error && <div className="bg-red-500/20 text-red-400 p-4 rounded-md text-center mb-8">{error}</div>}
        
        {loading && <div className="text-center">Carregando histórico inicial...</div>}

        {!loading && history.length > 0 && (
           <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-3">
            {history.slice(0, amountToShow).map((item) => (
              <div key={item.id} className="flex flex-col items-center group">
                 <div className="relative">
                   <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs bg-gray-700 rounded-md text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none break-all z-10">
                    {item.fullDate || 'Sem data'}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-md flex items-center justify-center font-bold text-xl border-2 transition-transform group-hover:-translate-y-1 ${colorClasses[item.color]}`}>
                  {item.number}
                </div>
                <div className="mt-1.5 text-xs text-gray-400 w-full text-center bg-black/50 rounded-b-md py-0.5">
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;