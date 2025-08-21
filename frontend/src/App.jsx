// frontend/src/App.jsx (VERSÃO FINAL COM TODAS AS CORREÇÕES)
import { useState, useEffect } from 'react';

const colorClasses = {
  red: 'bg-red-500 border-red-700 text-white',
  black: 'bg-gray-800 border-gray-900 text-white',
  white: 'bg-green-500 border-green-600 text-black',
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws');

function App() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [amountToShow, setAmountToShow] = useState(100);
  
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [colorSummary, setColorSummary] = useState(null);

  const handleNumberClick = (number) => {
    // Se clicar no mesmo número, limpa tudo
    if (selectedNumber === number) {
      setSelectedNumber(null);
      setAnalysisResult(null);
      return;
    }
    // Se clicar em um novo, limpa o resultado antigo e define o novo número
    setAnalysisResult(null);
    setSelectedNumber(number);
  };
  
  // --- FUNÇÃO CORRIGIDA PARA GARANTIR O RECALCULO ---
  const handleAmountChange = (newAmount) => {
    // Se a quantidade for a mesma, não faz nada
    if (amountToShow === newAmount) return;

    // Limpa o resultado da análise para forçar a atualização visual
    setAnalysisResult(null); 
    // Define a nova quantidade de rodadas
    setAmountToShow(newAmount);
    // O useEffect de análise será disparado pela mudança no 'amountToShow'
  };
  
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_URL}/api/history`);
        if (response.status === 202) { setLoading(false); return; }
        if (!response.ok) throw new Error('Falha ao carregar dados iniciais.');
        const data = await response.json();
        setHistory(data);
      } catch (err) { setError(err.message); } 
      finally { setLoading(false); }
    };
    fetchInitialData();
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => setConnectionStatus('Conectado em tempo real ✔️');
    ws.onmessage = (event) => setHistory(JSON.parse(event.data));
    ws.onclose = () => setConnectionStatus('Desconectado 🔴');
    ws.onerror = () => setConnectionStatus('Erro na conexão 🔴');
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (selectedNumber === null || history.length === 0) {
      setAnalysisResult(null);
      setColorSummary(null);
      return;
    }

    const stats = Array(15).fill(0);
    const historySlice = history.slice(0, amountToShow);

    for (let i = 0; i < historySlice.length - 1; i++) {
      const currentRound = historySlice[i];
      const previousRound = historySlice[i + 1];
      if (Number(previousRound.number) === Number(selectedNumber)) {
        const nextNumber = Number(currentRound.number);
        if (stats[nextNumber] !== undefined) {
          stats[nextNumber]++;
        }
      }
    }
    setAnalysisResult(stats);

    const colorCounts = { red: 0, black: 0, white: 0 };
    stats.forEach((count, number) => {
      if (count > 0) {
        if (number === 0) colorCounts.white += count;
        else if (number <= 7) colorCounts.red += count;
        else colorCounts.black += count;
      }
    });
    
    setColorSummary(colorCounts);

  }, [history, selectedNumber, amountToShow]);

  const analysisNumbers = Array.from({ length: 15 }, (_, i) => i);

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
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="amount" value={100} checked={amountToShow === 100} onChange={() => handleAmountChange(100)} className="form-radio h-5 w-5 text-blue-500"/>100</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="amount" value={200} checked={amountToShow === 200} onChange={() => handleAmountChange(200)} className="form-radio h-5 w-5 text-blue-500"/>200</label>
            </div>
            <div className="text-sm text-gray-400">{connectionStatus}</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-8">
          <h2 className="text-lg font-bold mb-4">Análise Pós-Número: Clique em um número para ver os próximos números mais frequentes</h2>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {analysisNumbers.map(num => (
              <button key={num} onClick={() => handleNumberClick(num)} className={`w-12 h-12 rounded-md flex items-center justify-center font-bold text-xl border-2 transition-all hover:border-yellow-400 ${selectedNumber === num ? 'border-yellow-400 scale-110' : 'border-gray-600'} ${num === 0 ? colorClasses.white : num <= 7 ? colorClasses.red : colorClasses.black}`}>
                {num}
              </button>
            ))}
          </div>

          {analysisResult && selectedNumber !== null && (
            <div className="bg-gray-700 p-4 rounded-md">
              <p className="font-bold text-lg mb-3 text-center">Após o número <span className="text-yellow-400">{selectedNumber}</span>, os próximos números foram:</p>
              
              {colorSummary && (
                <div className="border-t border-b border-gray-600 my-3 py-3 text-center">
                  <h4 className="font-bold mb-2">Total por Cor:</h4>
                  <div className="flex justify-center gap-4 text-xl">
                    <span className="text-red-500">Vermelho: <strong>{colorSummary.red}x</strong></span>
                    <span className="text-gray-300">Preto: <strong>{colorSummary.black}x</strong></span>
                    <span className="text-green-500">Branco: <strong>{colorSummary.white}x</strong></span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3 pt-3">
                {analysisResult.map((count, number) => ({ count, number }))
                    .filter(item => item.count > 0)
                    .sort((a, b) => b.count - a.count)
                    .map(({ count, number }) => (
                      <div key={number} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm border-2 ${number === 0 ? colorClasses.white : number <= 7 ? colorClasses.red : colorClasses.black}`}>
                          {number}
                        </div>
                        <span className="font-bold text-lg">{count}x</span>
                      </div>
                    ))
                }
                {analysisResult.every(count => count === 0) && (
                   <p className="text-gray-400">Nenhuma ocorrência encontrada no histórico selecionado.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-500/20 text-red-400 p-4 rounded-md text-center mb-8">{error}</div>}
        {loading && <div className="text-center">Carregando histórico inicial...</div>}

        {!loading && history.length > 0 && (
           <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-3">
            {history.slice(0, amountToShow).map((item) => (
              <div key={item.id || item.seed} className="flex flex-col items-center group">
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

export default App; //versao estavel