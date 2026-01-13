import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, getDocs, query, 
  orderBy, serverTimestamp, doc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { PlusCircle, History, Timer, Waves, Trash2, Edit3, BarChart3, X, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

  const calcularCalorias = (minutos) => {
    const met = 7.0; 
    return Math.round(((met * 3.5 * peso) / 200) * minutos);
  };

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
        alert('Treino atualizado!');
      } else {
        await addDoc(collection(db, "treinos"), { ...dados, createdAt: serverTimestamp() });
        alert('Treino registrado!');
      }
      
      setDistancia('1500'); setTempo('60');
      buscarHistorico();
      setActiveTab('historico');
    } catch (e) { alert('Erro: ' + e.message); }
    setLoading(false);
  };

  const deletarTreino = async (id) => {
    if (window.confirm("Deseja excluir este registro?")) {
      await deleteDoc(doc(db, "treinos", id));
      buscarHistorico();
    }
  };

  const iniciarEdicao = (item) => {
    setEditingId(item.id);
    setDistancia(item.distancia.toString());
    setTempo(item.duracao.toString());
    setActiveTab('novo');
  };

  async function buscarHistorico() {
    try {
      const q = query(collection(db, "treinos"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      setHistorico(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  }

  // Lógica do Gráfico: Agrupar por Mês
  const dadosGrafico = historico.reduce((acc, curr) => {
    if (!curr.createdAt) return acc;
    const data = new Date(curr.createdAt.seconds * 1000);
    const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    const existente = acc.find(item => item.name === mesAno);
    if (existente) {
      existente.total += curr.distancia;
    } else {
      acc.push({ name: mesAno, total: curr.distancia });
    }
    return acc;
  }, []).reverse();

  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-sans antialiased">
      <header className="bg-gradient-to-br from-blue-700 to-blue-900 text-white pt-10 pb-14 px-6 rounded-b-[40px] shadow-lg text-center">
        <h1 className="text-3xl font-black italic tracking-tighter">SWIMLOG</h1>
        <p className="text-blue-200 text-[10px] font-bold uppercase mt-1 tracking-widest">Evolução Mensal • {peso}kg</p>
      </header>

      <main className="px-5 -mt-8">
        {activeTab === 'novo' && (
          <div className="bg-white p-7 rounded-[35px] shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
               <h2 className="text-slate-800 font-black text-xl">{editingId ? 'Editar Treino' : 'Novo Registro'}</h2>
               {editingId && <button onClick={() => {setEditingId(null); setDistancia('1500'); setTempo('60');}} className="text-red-500"><X size={20}/></button>}
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Distância (Metros)</label>
              <input type="number" value={distancia} onChange={(e) => setDistancia(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none text-2xl font-bold text-center" />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Duração (Minutos)</label>
              <input type="number" value={tempo} onChange={(e) => setTempo(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none text-2xl font-bold text-center" />
            </div>

            <div className="bg-orange-500 p-5 rounded-3xl text-white shadow-lg relative overflow-hidden">
              <p className="text-[10px] font-bold uppercase opacity-80">Energia Gastada</p>
              <p className="text-4xl font-black">{calcularCalorias(tempo)} <span className="text-lg font-medium">kcal</span></p>
              <Calculator className="absolute -right-4 -bottom-4 opacity-20 rotate-12" size={70} />
            </div>

            <button onClick={salvarTreino} disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-[22px] font-black text-lg shadow-blue-200 shadow-lg active:scale-95 transition-all">
              {loading ? 'PROCESSANDO...' : editingId ? 'ATUALIZAR' : 'REGISTRAR AGORA'}
            </button>
          </div>
        )}

        {activeTab === 'grafico' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border border-slate-100 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-slate-800 font-black text-xl flex items-center gap-2"><BarChart3 size={20}/> Evolução (Metros/Mês)</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="total" radius={[10, 10, 10, 10]}>
                    {dadosGrafico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === dadosGrafico.length - 1 ? '#2563eb' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-center text-slate-400 font-medium italic">Comparativo de volume total mensal de nado</p>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-slate-800 font-black text-xl px-2">Histórico Recente</h2>
            {historico.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Waves size={22} /></div>
                  <div>
                    <p className="font-black text-slate-800 text-lg">{item.distancia}m</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.duracao} min • {item.calorias} kcal</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => iniciarEdicao(item)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={18}/></button>
                  <button onClick={() => deletarTreino(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Menu Inferior com 3 Botões */}
      <nav className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-lg border border-slate-200/50 p-4 flex justify-around items-center rounded-[30px] z-50 shadow-2xl">
        <button onClick={() => setActiveTab('novo')} className={`p-3 transition-all ${activeTab === 'novo' ? 'text-blue-600 scale-125 bg-blue-50 rounded-2xl' : 'text-slate-300'}`}>
          <PlusCircle size={26} strokeWidth={2.5} />
        </button>
        <button onClick={() => setActiveTab('grafico')} className={`p-3 transition-all ${activeTab === 'grafico' ? 'text-blue-600 scale-125 bg-blue-50 rounded-2xl' : 'text-slate-300'}`}>
          <BarChart3 size={26} strokeWidth={2.5} />
        </button>
        <button onClick={() => setActiveTab('historico')} className={`p-3 transition-all ${activeTab === 'historico' ? 'text-blue-600 scale-125 bg-blue-50 rounded-2xl' : 'text-slate-300'}`}>
          <History size={26} strokeWidth={2.5} />
        </button>
      </nav>
    </div>
  );
}
