'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, Bot, TrendingUp, RefreshCw, Zap, Layers, 
  RotateCcw, Globe, LogOut, CheckCircle, ShieldAlert, 
  Sparkles, Plus, Trash2, ArrowUpRight, ArrowDownRight, Clock,
  Search, Flame, LineChart, ChevronRight
} from 'lucide-react';

function getBrowserSupabase() {
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  try {
    const parsed = new URL(rawUrl);
    rawUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {}
  let rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
  return createClient(rawUrl, rawKey);
}

const supabase = getBrowserSupabase();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'MARKETS' | 'AUTO_SIM' | 'MY_PORTFOLIO'>('MARKETS');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Données
  const [markets, setMarkets] = useState<any[]>([]);
  const [manualPositions, setManualPositions] = useState<any[]>([]);
  const [simPortfolio, setSimPortfolio] = useState<any>({ cash_balance: 500, total_value: 500 });
  const [simPositions, setSimPositions] = useState<any[]>([]);

  // Filtres
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'US' | 'PARIS'>('ALL');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');

  // Portefeuille formulaire
  const [portfolioSearchQuery, setPortfolioSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [newShares, setNewShares] = useState('5');
  const [newPrice, setNewPrice] = useState('');
  const [newThreshold, setNewThreshold] = useState('3.0');

  // Modal Graphique
  const [chartStock, setChartStock] = useState<any>(null);
  const [chartPeriod, setChartPeriod] = useState<'1D' | '1W' | '1M' | '1Y'>('1M');

  // Timer 5 minutes
  const [countdown, setCountdown] = useState(300);

  // Auth
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Initialisation Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Décompte 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const fetchData = async (userId?: string) => {
    try {
      const uId = userId || user?.id;
      const res = await fetch(`/api/scan${uId ? `?userId=${uId}` : ''}`);
      const data = await res.json();
      if (data.markets) setMarkets(data.markets);
      if (data.manualPositions) setManualPositions(data.manualPositions);
      if (data.simulationPortfolio) setSimPortfolio(data.simulationPortfolio);
      if (data.simulationPositions) setSimPositions(data.simulationPositions);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        if (data.user) {
          await supabase.from('user_profiles').upsert({ id: data.user.id, email: authEmail, alert_email: authEmail });
          setStatusMsg('Compte créé ! Connecté.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setStatusMsg('Connexion réussie.');
      }
    } catch (err: any) {
      setStatusMsg('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStock = (stock: any) => {
    setSelectedStock(stock);
    setNewPrice(stock.price.toString());
    setPortfolioSearchQuery('');
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStock) return;
    setLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MANUAL_POSITION',
          userId: user.id,
          ticker: selectedStock.ticker,
          name: selectedStock.name,
          shares: newShares,
          averageBuyPrice: newPrice || selectedStock.price,
          alertThreshold: newThreshold
        })
      });
      const data = await res.json();
      setStatusMsg(data.message || 'Position enregistrée !');
      setSelectedStock(null);
      setNewPrice('');
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteManual = async (posId: string) => {
    if (!user) return;
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_MANUAL_POSITION', userId: user.id, positionId: posId })
    });
    fetchData();
  };

  const handleRunSimulation = async () => {
    if (!user) return;
    setLoading(true);
    setStatusMsg('Gemini et Groq scannent les plus fortes hausses et investissent...');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'AUTO_SIMULATION_STEP', userId: user.id })
      });
      const data = await res.json();
      setStatusMsg(data.message || 'Simulation actualisée.');
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleResetSimulation = async () => {
    if (!user || !confirm('Réinitialiser la simulation à 500 € ?')) return;
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESET_SIMULATION', userId: user.id })
    });
    fetchData();
  };

  // RECHERCHE INTELLIGENTE TOLÉRANTE (SANS ACCENTS, MULTI-MOTS, CAS D'ERREURS)
  const smartMatch = (item: any, rawQuery: string) => {
    if (!rawQuery.trim()) return true;
    const clean = (s: string) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const q = clean(rawQuery);
    const corpus = clean(`${item.ticker} ${item.name} ${item.category} ${item.keywords || ''}`);
    
    if (corpus.includes(q)) return true;
    const words = q.split(/\s+/);
    return words.some(w => w.length > 2 && corpus.includes(w));
  };

  const filteredMarkets = markets.filter(m => {
    const matchFilter = marketFilter === 'ALL' || m.market === marketFilter;
    const matchSearch = smartMatch(m, marketSearchQuery);
    return matchFilter && matchSearch;
  });

  const portfolioSuggestions = portfolioSearchQuery.trim() === '' ? [] : markets.filter(m => smartMatch(m, portfolioSearchQuery));

  // Rendu de la courbe graphique SVG
  const renderSvgChart = (points: number[], isUp: boolean) => {
    if (!points || points.length === 0) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const w = 320;
    const h = 120;
    const coords = points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 20) - 10;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = isUp ? '#10b981' : '#ef4444';
    const fillColor = isUp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    const polygonPoints = `0,${h} ${coords} ${w},${h}`;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '140px', overflow: 'visible' }}>
        <polygon points={polygonPoints} fill={fillColor} />
        <polyline points={coords} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // ÉCRAN AUTH
  if (!user) {
    return (
      <div style={{ backgroundColor: '#090d16', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.75rem', borderRadius: '16px', maxWidth: '380px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Bot size={28} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>AI Trading Manager</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            Connectez-vous pour débloquer votre sentinelle boursière et la détection de pépites.
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Votre E-mail</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="nom@exemple.com"
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box', marginTop: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mot de passe</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box', marginTop: '0.25rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.8rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
              {loading ? 'Connexion...' : isSignUp ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>

          {statusMsg && <p style={{ color: '#38bdf8', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>{statusMsg}</p>}

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '1.5rem' }}>
            {isSignUp ? 'Vous avez déjà un compte ?' : "Pas encore de compte ?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', marginLeft: '0.4rem', fontWeight: 700 }}>
              {isSignUp ? 'Se connecter' : "Créer un compte"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER MOBILE RESPONSIVE */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', position: 'sticky', top: 0, zIndex: 30, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Bot size={20} color="#38bdf8" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.3px' }}>AI Trading</span>
          </div>
        </div>

        {/* TIMER DISCRET DANS L'EN-TÊTE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#172033', border: '1px solid #334155', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <Clock size={12} color="#38bdf8" />
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>{formatTimer(countdown)}</span>
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            title="Se déconnecter"
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* MENU TIROIR */}
      {menuOpen && (
        <div style={{ backgroundColor: '#172033', borderBottom: '1px solid #334155', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            onClick={() => { setActiveTab('MARKETS'); setMenuOpen(false); }}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'MARKETS' ? '#2563eb' : '#1e293b', color: '#fff', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>
            1. Analyse & Détecteur de Pépites
          </button>
          <button
            onClick={() => { setActiveTab('AUTO_SIM'); setMenuOpen(false); }}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'AUTO_SIM' ? '#2563eb' : '#1e293b', color: '#fff', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>
            2. Simulation Automatique (500 €)
          </button>
          <button
            onClick={() => { setActiveTab('MY_PORTFOLIO'); setMenuOpen(false); }}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'MY_PORTFOLIO' ? '#2563eb' : '#1e293b', color: '#fff', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>
            3. Mon Portefeuille Réel & Alertes
          </button>
        </div>
      )}

      {/* BANDEAU NOTIFICATION D'ACTION */}
      {statusMsg && (
        <div style={{ backgroundColor: '#131b2e', borderBottom: '1px solid #2563eb', padding: '0.65rem 1rem', fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={14} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* CORPS DE PAGE */}
      <main style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '1rem', boxSizing: 'border-box' }}>

        {/* ======================================================== */}
        {/* ONGLET 1 : ANALYSE & PÉPITES */}
        {/* ======================================================== */}
        {activeTab === 'MARKETS' && (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            
            {/* TITRE + SÉLECTEURS */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <Flame size={20} color="#f59e0b" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Détecteur de Pépites</h2>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>
                Classement en direct des plus fortes hausses et recommandations IA.
              </p>

              {/* FILTRE MARCHÉ BUTTONS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', width: '100%', boxSizing: 'border-box' }}>
                {(['ALL', 'US', 'PARIS'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setMarketFilter(f)}
                    style={{
                      padding: '0.55rem 0.2rem', borderRadius: '8px', border: '1px solid #334155',
                      backgroundColor: marketFilter === f ? '#2563eb' : '#111827', color: '#fff',
                      fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center'
                    }}>
                    {f === 'ALL' ? 'Toutes' : f === 'US' ? 'Wall Street' : 'Paris'}
                  </button>
                ))}
              </div>
            </div>

            {/* BARRE DE RECHERCHE INTELLIGENTE */}
            <div style={{ position: 'relative', width: '100%', marginBottom: '1.25rem', boxSizing: 'border-box' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={marketSearchQuery}
                onChange={e => setMarketSearchQuery(e.target.value)}
                placeholder="Rechercher (ex: Dassault, Nvidia, ASTS, Rafale, Vusion...)"
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '10px',
                  color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>

            {/* LISTE DES ACTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', width: '100%', boxSizing: 'border-box' }}>
              {filteredMarkets.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', backgroundColor: '#111827', borderRadius: '12px' }}>
                  Aucune action ne correspond à votre recherche.
                </div>
              ) : (
                filteredMarkets.map((m) => (
                  <div
                    key={m.ticker}
                    onClick={() => setChartStock(m)}
                    style={{
                      backgroundColor: '#111827',
                      border: m.isSurge ? '1px solid #f59e0b' : '1px solid #1f2937',
                      borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column',
                      gap: '0.65rem', boxSizing: 'border-box', cursor: 'pointer'
                    }}>
                    
                    {/* HAUT DE CARTE */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{m.ticker}</span>
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#1e293b', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#94a3b8' }}>
                            {m.market === 'US' ? 'US' : 'PARIS'}
                          </span>
                          <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                            {m.category}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>{m.name}</div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{m.price} €</div>
                        <div style={{ fontSize: '0.85rem', color: m.changeRaw >= 0 ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                          {m.change}
                        </div>
                      </div>
                    </div>

                    {/* BADGE CONSEIL IA */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.4rem 0.65rem', borderRadius: '6px',
                      backgroundColor: m.isSurge ? 'rgba(245, 158, 11, 0.12)' : m.aiSignal.includes('FORT') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                      border: `1px solid ${m.isSurge ? '#f59e0b' : m.aiSignal.includes('FORT') ? '#10b981' : '#38bdf8'}`
                    }}>
                      <span style={{ fontWeight: 800, fontSize: '0.75rem', color: m.isSurge ? '#f59e0b' : m.aiSignal.includes('FORT') ? '#10b981' : '#38bdf8' }}>
                        {m.aiSignal}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Confiance : <strong style={{ color: '#fff' }}>{m.aiConfidence}%</strong>
                      </span>
                    </div>

                    {/* PHRASE AVIS IA */}
                    <div style={{ backgroundColor: '#1e293b', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.35' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                        💡 Avis & Analyse de l'IA
                      </span>
                      {m.aiAdvice}
                    </div>

                    {/* LIEN GRAPHIQUE */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#38bdf8', paddingTop: '0.2rem' }}>
                      <span>📈 Voir le graphique & l'historique</span>
                      <ChevronRight size={14} />
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 2 : SIMULATION 500 € */}
        {/* ======================================================== */}
        {activeTab === 'AUTO_SIM' && (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Simulation Autonome (500 €)</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.2rem 0 1rem 0' }}>
                L'IA arbitre le capital virtuel sur les pépites pour maximiser le rendement.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleRunSimulation}
                  disabled={loading}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: '0.7rem', backgroundColor: '#10b981', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                  }}>
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Recherche en cours...' : 'Déclencher Cycle IA'}
                </button>
                <button
                  onClick={handleResetSimulation}
                  title="Réinitialiser"
                  style={{ padding: '0.7rem', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}>
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* BANDEAU CAPITAL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>CASH DISPONIBLE</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  {Number(simPortfolio.cash_balance).toFixed(2)} €
                </div>
              </div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>VALEUR TOTALE</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem', color: '#10b981' }}>
                  {Number(simPortfolio.total_value).toFixed(2)} €
                </div>
              </div>
            </div>

            {/* CARTES DES ACTIONS DÉTENUES PAR L'IA */}
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem' }}>
              Positions Détenues par l'IA ({simPositions.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
              {simPositions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', backgroundColor: '#111827', borderRadius: '12px' }}>
                  L'IA n'a pas encore pris de positions. Cliquez sur <strong>« Déclencher Cycle IA »</strong>.
                </div>
              ) : (
                simPositions.map((p) => {
                  const isProfit = Number(p.pnl) >= 0;
                  return (
                    <div key={p.id} onClick={() => setChartStock(p)} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '1rem' }}>{p.company_name}</strong>
                          <span style={{ color: '#38bdf8', fontSize: '0.8rem', marginLeft: '0.4rem' }}>{p.ticker}</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{p.current_value} €</div>
                      </div>

                      {/* DEUX LIGNES BIEN SÉPARÉES POUR ACHAT ET ACTUEL */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#090d16', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Prix d'achat unitaire :</span>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{p.average_buy_price} €</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#94a3b8' }}>Cours en direct :</span>
                          <div style={{ fontWeight: 700, color: '#38bdf8' }}>{p.current_price} €</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ color: '#94a3b8' }}>Parts : {p.shares}</span>
                        <div style={{ color: isProfit ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                          {isProfit ? '+' : ''}{p.pnl} € ({p.pnl_percent}%)
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 3 : MON PORTEFEUILLE RÉEL (VISUEL PRO MOBILE) */}
        {/* ======================================================== */}
        {activeTab === 'MY_PORTFOLIO' && (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Mon Vrai Portefeuille</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.2rem 0 1rem 0' }}>
                Surveillance 24h/24 : ajoutez vos actions réelles pour recevoir les alertes.
              </p>
            </div>

            {/* FORMULAIRE RECHERCHE FLUIDE */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Ajouter une action</span>

              <div style={{ position: 'relative', width: '100%', marginBottom: '0.75rem' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={portfolioSearchQuery}
                  onChange={e => setPortfolioSearchQuery(e.target.value)}
                  placeholder="Tapez (ex: Dassault, Nvidia, Total, Airbus...)"
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.4rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />

                {/* SUGGESTIONS INTELLIGENTES */}
                {portfolioSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, backgroundColor: '#172033', border: '1px solid #334155', borderRadius: '8px', zIndex: 20, maxHeight: '200px', overflowY: 'auto' }}>
                    {portfolioSuggestions.map(s => (
                      <div
                        key={s.ticker}
                        onClick={() => handleSelectStock(s)}
                        style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{s.name}</strong>
                          <span style={{ color: '#38bdf8', fontSize: '0.8rem', marginLeft: '0.3rem' }}>({s.ticker})</span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>{s.price} €</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ÉTAPE SUIVANTE APRES SÉLECTION */}
              {selectedStock && (
                <form onSubmit={handleAddManual} style={{ backgroundColor: '#172033', padding: '0.85rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>{selectedStock.name} ({selectedStock.ticker})</span>
                    <button
                      type="button"
                      onClick={() => setNewPrice(selectedStock.price.toString())}
                      style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                      Cours actuel : {selectedStock.price} €
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Parts détenues</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={newShares}
                        onChange={e => setNewShares(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Prix d'achat (€)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        placeholder={selectedStock.price.toString()}
                        style={{ width: '100%', padding: '0.55rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '0.65rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                    Enregistrer dans mon Portefeuille
                  </button>
                </form>
              )}
            </div>

            {/* LISTE PRO FORMAT CARTE MOBILE (DIVERSIFIÉ EN PLUSIEURS LIGNES) */}
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem' }}>
              Vos Actions Surveillées ({manualPositions.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
              {manualPositions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', backgroundColor: '#111827', borderRadius: '12px' }}>
                  Aucune action suivie pour l'instant. Utilisez la recherche ci-dessus pour ajouter votre premier actif.
                </div>
              ) : (
                manualPositions.map((p) => {
                  const isProfit = Number(p.pnl) >= 0;
                  return (
                    <div
                      key={p.id}
                      style={{
                        backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px',
                        padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', boxSizing: 'border-box'
                      }}>
                      
                      {/* LIGNE 1 : NOM + VALEUR TOTALE */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong style={{ fontSize: '1.05rem' }}>{p.company_name}</strong>
                            <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>{p.ticker}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Quantité : {p.shares} actions</span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{p.current_value} €</div>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800,
                            backgroundColor: isProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isProfit ? '#10b981' : '#ef4444', marginTop: '0.15rem'
                          }}>
                            {isProfit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {isProfit ? '+' : ''}{p.pnl} € ({p.pnl_percent}%)
                          </div>
                        </div>
                      </div>

                      {/* LIGNE 2 : DEUX BLOCS SEPARES POUR PRIX D'ACHAT VS COURS EN DIRECT */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '8px',
                        padding: '0.6rem 0.8rem', fontSize: '0.75rem'
                      }}>
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>Prix d'achat unitaire</span>
                          <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{p.average_buy_price} €</strong>
                        </div>
                        <div style={{ textAlign: 'right', borderLeft: '1px solid #1f2937', paddingLeft: '0.8rem' }}>
                          <span style={{ color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>Cours actuel en direct</span>
                          <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>{p.current_price} €</strong>
                        </div>
                      </div>

                      {/* LIGNE 3 : AVIS IA + SUPPRESSION */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.2rem' }}>
                        <button
                          onClick={() => setChartStock(p)}
                          style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <LineChart size={14} /> Voir le graphique
                        </button>

                        <button
                          onClick={() => handleDeleteManual(p.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Trash2 size={14} /> Retirer
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL GRAPHIQUE INTERACTIF (1J, 1S, 1M, 1A) */}
      {/* ======================================================== */}
      {chartStock && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50,
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#111827', borderTop: '1px solid #334155', borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.25rem', boxSizing: 'border-box'
          }}>
            
            {/* EN-TÊTE MODAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{chartStock.name}</h3>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>({chartStock.ticker})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{chartStock.price || chartStock.current_price} €</span>
                  <span style={{ fontSize: '0.9rem', color: (chartStock.changeRaw ?? 1) >= 0 ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                    {chartStock.change || `${chartStock.pnl_percent}%`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setChartStock(null)}
                style={{ background: '#1e293b', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* SÉLECTEUR DE PÉRIODE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', backgroundColor: '#090d16', padding: '0.3rem', borderRadius: '8px', marginBottom: '1rem' }}>
              {(['1D', '1W', '1M', '1Y'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  style={{
                    padding: '0.4rem', borderRadius: '6px', border: 'none',
                    backgroundColor: chartPeriod === p ? '#2563eb' : 'transparent',
                    color: chartPeriod === p ? '#fff' : '#94a3b8',
                    fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                  }}>
                  {p === '1D' ? '1 Jour' : p === '1W' ? '1 Semaine' : p === '1M' ? '1 Mois' : '1 An'}
                </button>
              ))}
            </div>

            {/* LE GRAPHIQUE SVG DYNAMIQUE */}
            <div style={{ backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '12px', padding: '1rem 0.5rem', marginBottom: '1rem' }}>
              {chartStock.history ? (
                renderSvgChart(chartStock.history[chartPeriod] || [], (chartStock.changeRaw ?? 1) >= 0)
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Historique en cours de chargement...</div>
              )}
            </div>

            {/* AVIS COMPLET DE L'IA */}
            <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                🎯 Synthèse & Diagnostic de l'IA
              </span>
              <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.4' }}>
                {chartStock.aiAdvice || "Surveillance algorithmique continue par Gemini & Groq."}
              </p>
            </div>

            <button
              onClick={() => setChartStock(null)}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Fermer la vue graphique
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
