import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, getDocs, query, 
  orderBy, serverTimestamp, doc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { PlusCircle, History, Timer, Waves, Trash2, Edit3, BarChart3, X, Calculator } from 'lucide-react';

// Suas chaves configuradas
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
  const [editingId, setEditingId] = useState(null);

  const peso = 75;

  useEffect(() => { buscarHistorico(); }, []);

  async function buscarHistorico() {
    try {
      const q = query(collection(db, "treinos"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      setHistorico(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error("Erro Firebase:", e); }
  }

  const calcularCalorias = (minutos) => Math.round(((7.0 * 3.5 * peso) / 200) * minutos);

  const salvarTreino = async () => {
    setLoading(true);
    try {
      const dados = {
        distancia: parseInt(distancia),
        duracao: parseInt(tempo),
        calorias: calcularCalorias(parseInt(tempo)),
      };

      if (editingId) {
        await updateDoc(doc(db, "treinos", editingId), dados);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "treinos"), { ...dados, createdAt: serverTimestamp() });
      }
      
      setDistancia('1500'); setTempo('60');
      buscarHistorico();
      setActiveTab('historico');
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const deletarTreino = async (id) => {
    if (confirm("Deseja eliminar este registo?")) {
      await deleteDoc(doc(db, "treinos", id));
      buscarHistorico();
    }
  };

  // Lógica do Gráfico Manual (Soma por mês)
  const obterDadosMensais = () => {
    const meses = {};
    historico.forEach(t => {
      if (!t.createdAt) return;
      const data = new Date(t.createdAt.seconds * 1000);
      const label = data.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
      meses[label] = (meses[label] || 0) + t.distancia;
    });
    return Object.entries(meses).map(([name, total]) => ({ name, total })).reverse();
  };

  const dadosGrafico = obterDadosMensais();
  const valorMaximo = Math.max(...dadosGrafico.map(d => d.total), 1);

  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-sans antialiased">
      <header className="bg-gradient-to-br from-blue-600 to-blue-800 text-white pt-12 pb-14 px-6 rounded-b-[45px] shadow-lg text-center">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">SwimLog</h1>
        <p className="text-blue-100 text-[10px] font-bold uppercase mt-1 opacity-80 tracking-widest">
           {peso}kg • 1.58m
        </p>
      </header>

      <main className="px-5 -mt-8">
        {activeTab === 'novo' ? (
          <div className="bg-white p-7 rounded-[35px] shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <h2 className="text-slate-800 font-black text-xl text-center">{editingId ? 'Editar Treino' : 'Novo Registro'}</h2>
            <div className="space-y-4">
              <input type="number" value={distancia} onChange={(e) => setDistancia(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none text-2xl font-bold text-center" placeholder="Metros" />
              <input type="number" value={tempo} onChange={(e) => setTempo(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none text-2xl font-bold text-center" placeholder="Minutos" />
            </div>
            <div className="bg-orange-500 p-5 rounded-3xl text-white text-center shadow-lg relative overflow-hidden">
              <p className="text-[10px] font-bold uppercase opacity-80">Gasto Estimado</p>
              <p className="text-4xl font-black">{calcularCalorias(tempo)} kcal</p>
              <Calculator className="absolute -right-4 -bottom-4 opacity-20" size={70} />
            </div>
            <button onClick={salvarTreino} className="w-full bg-blue-600 text-white py-5 rounded-[22px] font-black text-lg shadow-xl active:scale-95 transition-all">
              {loading ? '...' : editingId ? 'GUARDAR ALTERAÇÃO' : 'REGISTAR TREINO'}
            </button>
          </div>
        ) : activeTab === 'grafico' ? (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border border-slate-100 space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-slate-800 font-black text-xl flex items-center gap-2"><BarChart3 size={20}/> Metros por Mês</h2>
            <div className="flex items-end justify-around h-52 pt-10 px-2">
              {dadosGrafico.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full max-w-[40px]">
                  <div className="text-[9px] font-bold text-blue-600 mb-1">{d.total}m</div>
                  <div 
                    className="bg-blue-500 w-full rounded-t-lg shadow-md transition-all duration-700" 
                    style={{ height: `${(d.total / valorMaximo) * 100}%`, minHeight: '5px' }}
                  ></div>
                  <div className="text-[10px] font-black text-slate-400 mt-2">{d.name}</div>
                </div>
              ))}
            </div>
            {dadosGrafico.length === 0 && <p className="text-center text-slate-400 italic py-10">Sem dados para exibir.</p>}
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-slate-800 font-black text-xl px-2">Histórico</h2>
            {historico.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-slate-100 group">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Waves size={22} /></div>
                  <div>
                    <p className="font-black text-slate-800 text-lg">{item.distancia}m</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.duracao} min • {item.calorias} kcal</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(item.id); setDistancia(item.distancia); setTempo(item.duracao); setActiveTab('novo'); }} className="p-2 text-slate-300 hover:text-blue-500"><Edit3 size={18}/></button>
                  <button onClick={() => deletarTreino(item.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-lg border border-slate-200 p-4 flex justify-around items-center rounded-[30px] z-50 shadow-2xl">
        <button onClick={() => setActiveTab('novo')} className={`p-2 rounded-xl transition-all ${activeTab === 'novo' ? 'bg-blue-50 text-blue-600 scale-110' : 'text-slate-300'}`}><PlusCircle size={28} /></button>
        <button onClick={() => setActiveTab('grafico')} className={`p-2 rounded-xl transition-all ${activeTab === 'grafico' ? 'bg-blue-50 text-blue-600 scale-110' : 'text-slate-300'}`}><BarChart3 size={28} /></button>
        <button onClick={() => setActiveTab('historico')} className={`p-2 rounded-xl transition-all ${activeTab === 'historico' ? 'bg-blue-50 text-blue-600 scale-110' : 'text-slate-300'}`}><History size={28} /></button>
      </nav>
    </div>
  );
}
