import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { PlusCircle, History, Timer, Waves, Calculator } from 'lucide-react';

// Suas chaves de configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC8EpsTNkzLyDNYHMIKpNNgK-uMXBJcKfU",
  authDomain: "swim-log-a3418.firebaseapp.com",
  projectId: "swim-log-a3418",
  storageBucket: "swim-log-a3418.firebasestorage.app",
  messagingSenderId: "1012208718380",
  appId: "1:1012208718380:web:f67b44ca142f9d0643b789"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState('novo');
  const [distancia, setDistancia] = useState('1500'); 
  const [tempo, setTempo] = useState('60'); 
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);

  const peso = 75; // Seus dados físicos

  useEffect(() => {
    buscarHistorico();
  }, []);

  const calcularCalorias = (minutos) => {
    // MET 7.0 (Natação moderada)
    const met = 7.0;
    const resultado = ((met * 3.5 * peso) / 200) * minutos;
    return Math.round(resultado);
  };

  const salvarTreino = async () => {
    setLoading(true);
    const caloriasGastas = calcularCalorias(parseInt(tempo));
    
    try {
      await addDoc(collection(db, "treinos"), {
        distancia: parseInt(distancia),
        duracao: parseInt(tempo),
        calorias: caloriasGastas,
        createdAt: serverTimestamp()
      });

      alert('Treino registrado com sucesso!');
      setDistancia('1500');
      setTempo('60');
      buscarHistorico();
      setActiveTab('historico');
    } catch (e) {
      alert('Erro ao salvar no Firebase: ' + e.message);
    }
    setLoading(false);
  };

  async function buscarHistorico() {
    try {
      const q = query(collection(db, "treinos"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const dados = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistorico(dados);
    } catch (e) {
      console.error("Erro ao buscar histórico:", e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans antialiased">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-600 to-blue-800 text-white pt-12 pb-16 px-6 rounded-b-[45px] shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">SWIMLOG</h1>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">
              {peso}kg • 1.58m • 1300-1500 kcal
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Waves size={28} />
          </div>
        </div>
      </header>

      <main className="px-6 -mt-10">
        {activeTab === 'novo' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-7 rounded-[32px] shadow-2xl border border-slate-100 space-y-6">
              <h2 className="text-slate-800 font-black text-xl mb-4 text-center">Registrar Treino</h2>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block ml-1">Distância (Metros)</label>
                <input 
                  type="number" 
                  value={distancia}
                  onChange={(e) => setDistancia(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none text-2xl font-bold transition-all text-center"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block ml-1">Duração (Minutos)</label>
                <input 
                  type="number" 
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none text-2xl font-bold transition-all text-center"
                />
              </div>

              <div className="bg-orange-500 p-5 rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 text-center">
                  <p className="text-[10px] font-bold uppercase opacity-80">Queima Estimada</p>
                  <p className="text-4xl font-black">{calcularCalorias(tempo)} <span className="text-lg font-medium">kcal</span></p>
                </div>
                <Calculator className="absolute -right-4 -bottom-4 opacity-20 rotate-12" size={80} />
              </div>

              <button 
                onClick={salvarTreino}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-lg shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:bg-slate-300"
              >
                {loading ? 'GRAVANDO...' : 'FINALIZAR'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-slate-800 font-black text-xl px-2">Histórico</h2>
            <div className="space-y-3">
              {historico.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                      <Waves size={24} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg">{item.distancia}m</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                         <Timer size={10} /> {item.duracao} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-600 font-black text-lg">-{item.calorias} kcal</p>
                    <p className="text-[10px] text-slate-300 font-medium">
                      {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Hoje'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Nav Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-12 py-6 flex justify-around items-center rounded-t-[35px] z-50 shadow-2xl">
        <button onClick={() => setActiveTab('novo')} className={`flex flex-col items-center transition-all ${activeTab === 'novo' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <PlusCircle size={30} strokeWidth={2.5} />
        </button>
        <button onClick={() => setActiveTab('historico')} className={`flex flex-col items-center transition-all ${activeTab === 'historico' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <History size={30} strokeWidth={2.5} />
        </button>
      </nav>
    </div>
  );
}
