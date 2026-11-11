'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, Bot, TrendingUp, RefreshCw, Zap, Layers, 
  RotateCcw, Globe, LogOut, CheckCircle, ShieldAlert, 
  Sparkles, Plus, Trash2, ArrowUpRight, ArrowDownRight, Clock,
  Search, Flame, LineChart, ChevronRight, History, Landmark,
  HelpCircle, Info
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

// DÉFINITIONS ÉDUCATIVES DES TERMES BOURSIERS APPLE STOCKS
const METRIC_DEFINITIONS: Record<string, { title: string; desc: string }> = {
  'Ouverture': {
    title: 'Cours d’Ouverture',
    desc: 'Le prix de la toute première transaction négociée au moment où la bourse a ouvert ce matin.'
  },
  'Max.': {
    title: 'Plus Haut du Jour',
    desc: 'Le prix maximum payé par un acheteur pour cette action pendant la séance actuelle.'
  },
  'Min.': {
    title: 'Plus Bas du Jour',
    desc: 'Le prix le plus bas auquel cette action a été vendue aujourd’hui.'
  },
  'Vol.': {
    title: 'Volume Échangé',
    desc: 'Le nombre total d’actions achetées et vendues aujourd’hui. Un volume massif confirme la puissance et la fiabilité d’une hausse.'
  },
  'PER': {
    title: 'PER (Price Earnings Ratio)',
    desc: 'Ratio Cours/Bénéfice. Il indique combien de fois les investisseurs paient le bénéfice annuel de l’entreprise. Un PER modéré indique une action au juste prix, un PER élevé indique une forte attente de croissance future.'
  },
  'Cap. bours.': {
    title: 'Capitalisation Boursière',
    desc: 'La valeur marchande totale de toute l’entreprise en bourse (le prix d’une seule action multiplié par le nombre total d’actions émises).'
  },
  'H 52 sem.': {
    title: 'Plus Haut sur 52 Semaines (1 An)',
    desc: 'Le record absolu de prix atteint par cette action sur les 12 derniers mois.'
  },
  'B 52 sem.': {
    title: 'Plus Bas sur 52 Semaines (1 An)',
    desc: 'Le point le plus bas touché par cette action sur les 12 derniers mois.'
  }
};

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

  // Mon Portefeuille
  const [portfolioSearchQuery, setPortfolioSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [newShares, setNewShares] = useState('5');
  const [newPrice, setNewPrice] = useState('');
  const [newThreshold, setNewThreshold] = useState('3.0');

  // Modal Graphique Style Apple Bourse
  const [chartStock, setChartStock] = useState<any>(null);
  const [chartPeriod, setChartPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y'>('1D');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeDefinition, setActiveDefinition] = useState<{ title: string; desc: string } | null>(null);

  // Timer
  const [countdown, setCountdown] = useState(300);

  // Auth
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

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
      setStatusMsg(data.message || 'Position enregistrée.');
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
    setStatusMsg('Analyse algorithmique en cours...');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'AUTO_SIMULATION_STEP', userId: user.id })
      });
      const data = await res.json();
      setStatusMsg(data.message || 'Ordres exécutés.');
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

  const smartMatch = (item: any, rawQuery: string) => {
    if (!rawQuery.trim()) return true;
    const clean = (s: string) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const q = clean(rawQuery);
    const corpus = clean(`${item.ticker} ${item.name} ${item.category} ${item.keywords || ''}`);
    if (corpus.includes(q)) return true;
    return q.split(/\s+/).some(w => w.length > 2 && corpus.includes(w));
  };

  const filteredMarkets = markets.filter(m => {
    const matchFilter = marketFilter === 'ALL' || m.market === marketFilter;
    return matchFilter && smartMatch(m, marketSearchQuery);
  });

  const portfolioSuggestions = portfolioSearchQuery.trim() === '' ? [] : markets.filter(m => smartMatch(m, portfolioSearchQuery));

  const getBadgeStyle = (colorType: string) => {
    switch (colorType) {
      case 'GREEN_DARK':
        return { bg: 'rgba(5, 150, 105, 0.3)', border: '#059669', text: '#10b981', label: 'ACHAT FORT' };
      case 'GREEN_LIGHT':
        return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399', label: 'ACHAT' };
      case 'YELLOW':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24', label: 'ATTENTION / CONSERVER' };
      case 'RED':
      default:
        return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171', label: 'DÉCONSEILLÉ' };
    }
  };

  // RENDU EXACT DU GRAPHIQUE APPLE BOURSE (ÉCHELLE À DROITE, HEURES EN BAS, LIGNES)
  const renderAppleStocksExactChart = (chartData: any, isUp: boolean) => {
    if (!chartData || !chartData.points || chartData.points.length === 0) return null;
    const points = chartData.points;
    const min = chartData.low;
    const max = chartData.high;
    const range = max - min || 1;
    const w = 270;
    const h = 180;

    const coords = points.map((pt: any, idx: number) => {
      const x = (idx / (points.length - 1)) * w;
      const y = h - ((pt.price - min) / range) * (h - 30) - 15;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = isUp ? '#34c759' : '#ff3b30'; // Couleurs exactes Apple iOS
    const fillColor = isUp ? 'rgba(52, 199, 89, 0.14)' : 'rgba(255, 59, 48, 0.14)';
    const polygon = `0,${h} ${coords} ${w},${h}`;
    const scaleSteps: number[] = chartData.scaleSteps || [max, min];

    return (
      <div style={{ backgroundColor: '#000000', borderRadius: '12px', padding: '1rem 0.5rem 0.5rem 0.5rem', border: '1px solid #1c1c1e', boxSizing: 'border-box' }}>
        
        {/* CONTENEUR GRAPHIQUE + ÉCHELLE VERTICALE À DROITE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 65px', gap: '0.5rem', height: `${h}px`, position: 'relative' }}>
          
          {/* ZONE SVG */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            
            {/* Lignes de repère grises comme dans l'app Bourse */}
            <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, borderTop: '1px solid #1c1c1e' }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid #1c1c1e' }} />
            <div style={{ position: 'absolute', bottom: '15px', left: 0, right: 0, borderTop: '1px dashed #2c2c2e' }} />

            <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <polygon points={polygon} fill={fillColor} />
              <polyline points={coords} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* ÉCHELLE DES PRIX À DROITE (COMME SUR LA CAPTURE DSY.PA) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.2rem 0', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#8e8e93', borderLeft: '1px solid #1c1c1e', paddingLeft: '0.5rem' }}>
            {scaleSteps.map((val, idx) => (
              <span key={idx}>{val.toFixed(2).replace('.', ',')}</span>
            ))}
          </div>

        </div>

        {/* AXE X : REPÈRES TEMPORELS EN BAS (11, 13, 15, 17) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.5rem 0.2rem 0.5rem', fontSize: '0.75rem', color: '#8e8e93', borderTop: '1px solid #1c1c1e', marginTop: '0.5rem' }}>
          {points.map((pt: any, i: number) => (
            <span key={i}>{pt.label}</span>
          ))}
        </div>

      </div>
    );
  };

  const totalManualValue = manualPositions.reduce((acc, p) => acc + (Number(p.current_value) || 0), 0);
  const totalManualCost = manualPositions.reduce((acc, p) => acc + (Number(p.cost_basis) || 0), 0);
  const manualPnL = totalManualValue - totalManualCost;
  const manualPnLPercent = totalManualCost > 0 ? (manualPnL / totalManualCost) * 100 : 0;

  if (!user) {
    return (
      <div style={{ backgroundColor: '#000000', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', padding: '1.75rem', borderRadius: '16px', maxWidth: '380px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Bot size={28} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>AI Trading Manager</h2>
          </div>
          <p style={{ color: '#8e8e93', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            Connectez-vous pour débloquer votre sentinelle boursière et la détection de pépites.
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#8e8e93' }}>Votre E-mail</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="nom@exemple.com"
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', border: '1px solid #3a3a3c', borderRadius: '8px', color: '#fff', boxSizing: 'border-box', marginTop: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#8e8e93' }}>Mot de passe</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', border: '1px solid #3a3a3c', borderRadius: '8px', color: '#fff', boxSizing: 'border-box', marginTop: '0.25rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.8rem', backgroundColor: '#0071e3', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
              {loading ? 'Connexion...' : isSignUp ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>

          {statusMsg && <p style={{ color: '#38bdf8', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>{statusMsg}</p>}

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#8e8e93', marginTop: '1.5rem' }}>
            {isSignUp ? 'Vous avez déjà un compte ?' : "Pas encore de compte ?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'none', border: 'none', color: '#2997ff', cursor: 'pointer', marginLeft: '0.4rem', fontWeight: 700 }}>
              {isSignUp ? 'Se connecter' : "Créer un compte"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000000', color: '#f5f5f7', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* HEADER iOS */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', backgroundColor: '#1c1c1e', borderBottom: '1px solid #2c2c2e', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Bot size={20} color="#2997ff" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Bourse IA</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#2c2c2e', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem' }}>
            <Clock size={12} color="#2997ff" />
            <span style={{ color: '#8e8e93' }}>Scan :</span>
            <strong style={{ color: '#fff' }}>{formatTimer(countdown)}</strong>
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            title="Déconnexion"
            style={{ background: 'none', border: 'none', color: '#ff453a', cursor: 'pointer' }}>
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* MENU TIROIR */}
      {menuOpen && (
        <div style={{ backgroundColor: '#1c1c1e', borderBottom: '1px solid #2c2c2e', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            onClick={() => { setActiveTab('MARKETS'); setMenuOpen(false); }}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'MARKETS' ? '#0071e3' : '#2c2c2e', color: '#fff', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>
            1. Analyse & Détecteur de Pépites
          </button>
          <button
            onClick={() => { setActiveTab('AUTO_SIM'); setMenuOpen(false); }}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'AUTO_SIM' ? '#0071e3' : '#2c2c2e', color: '#fff', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>
            2. Simulation Automatique (500 €)
          </button>
          <button
            onClick={() => { setActiveTab('MY_PORTFOLIO'); setMenuOpen(false); }}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'MY_PORTFOLIO' ? '#0071e3' : '#2c2c2e', color: '#fff', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>
            3. Mon Portefeuille Réel & Alertes
          </button>
        </div>
      )}

      {statusMsg && (
        <div style={{ backgroundColor: '#1c1c1e', borderBottom: '1px solid #0071e3', padding: '0.65rem 1rem', fontSize: '0.8rem', color: '#2997ff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={14} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* CONTENU PRINCIPAL */}
      <main style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '1rem', boxSizing: 'border-box' }}>

        {/* ======================================================== */}
        {/* ONGLET 1 : ANALYSE DU MARCHÉ & PÉPITES */}
        {/* ======================================================== */}
        {activeTab === 'MARKETS' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <Flame size={20} color="#ff9f0a" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Détecteur de Pépites</h2>
              </div>
              <p style={{ color: '#8e8e93', fontSize: '0.8rem', margin: '0 0 0.85rem 0' }}>
                Marchés en direct, catalyseurs et recommandations de l'IA par code couleur.
              </p>

              {/* FILTRES MARCHÉS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', width: '100%', boxSizing: 'border-box' }}>
                {(['ALL', 'US', 'PARIS'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setMarketFilter(f)}
                    style={{
                      padding: '0.55rem 0.2rem', borderRadius: '8px', border: '1px solid #3a3a3c',
                      backgroundColor: marketFilter === f ? '#0071e3' : '#1c1c1e', color: '#fff',
                      fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center'
                    }}>
                    {f === 'ALL' ? 'Toutes' : f === 'US' ? 'Wall Street' : 'Paris'}
                  </button>
                ))}
              </div>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div style={{ position: 'relative', width: '100%', marginBottom: '1.2rem' }}>
              <Search size={16} color="#8e8e93" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={marketSearchQuery}
                onChange={e => setMarketSearchQuery(e.target.value)}
                placeholder="Rechercher (Dassault, DSY.PA, Nvidia, ASTS...)"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* LISTE DES ACTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredMarkets.map((m) => {
                const badge = getBadgeStyle(m.aiColor);
                return (
                  <div
                    key={m.ticker}
                    onClick={() => setChartStock(m)}
                    style={{
                      backgroundColor: '#1c1c1e',
                      border: `1px solid ${badge.border}`,
                      borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column',
                      gap: '0.65rem', boxSizing: 'border-box', cursor: 'pointer'
                    }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{m.ticker}</span>
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#2c2c2e', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#8e8e93' }}>
                            {m.market === 'US' ? 'US' : 'PARIS'}
                          </span>
                          <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(41, 151, 255, 0.15)', color: '#2997ff', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                            {m.category}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#8e8e93', marginTop: '0.15rem' }}>{m.name}</div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{m.priceFormatted} €</div>
                        <div style={{ fontSize: '0.85rem', color: m.changeRaw >= 0 ? '#34c759' : '#ff3b30', fontWeight: 800 }}>
                          {m.change}
                        </div>
                      </div>
                    </div>

                    {/* BADGE DU CODE COULEUR DE RECOMMANDATION */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.45rem 0.75rem', borderRadius: '6px',
                      backgroundColor: badge.bg, border: `1px solid ${badge.border}`
                    }}>
                      <span style={{ fontWeight: 800, fontSize: '0.75rem', color: badge.text }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#8e8e93' }}>
                        Confiance : <strong style={{ color: '#fff' }}>{m.aiConfidence}%</strong>
                      </span>
                    </div>

                    <div style={{ backgroundColor: '#2c2c2e', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem', color: '#f5f5f7', lineHeight: '1.35' }}>
                      {m.aiAdvice}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#2997ff' }}>
                      <span>📈 Toucher pour ouvrir le graphique Bourse Apple</span>
                      <ChevronRight size={14} />
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 2 : SIMULATION 500 € + HISTORIQUE */}
        {/* ======================================================== */}
        {activeTab === 'AUTO_SIM' && (
          <div>
            <div style={{ marginBottom: '1.2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Simulation Autonome (500 €)</h2>
              <p style={{ color: '#8e8e93', fontSize: '0.8rem', margin: '0.2rem 0 1rem 0' }}>
                L'IA gère et arbitre ce capital fictif en direct sur les pépites.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleRunSimulation}
                  disabled={loading}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: '0.7rem', backgroundColor: '#34c759', color: '#000',
                    border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                  }}>
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'L’IA analyse...' : 'Déclencher Cycle IA'}
                </button>

                <button
                  onClick={() => setHistoryOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.7rem 0.9rem', backgroundColor: '#1c1c1e', color: '#2997ff', border: '1px solid #3a3a3c', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  <History size={15} /> Ordres
                </button>

                <button
                  onClick={handleResetSimulation}
                  title="Réinitialiser"
                  style={{ padding: '0.7rem', backgroundColor: '#1c1c1e', color: '#8e8e93', border: '1px solid #3a3a3c', borderRadius: '8px', cursor: 'pointer' }}>
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', padding: '0.85rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.7rem', color: '#8e8e93', fontWeight: 600 }}>CASH RESTANT</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  {Number(simPortfolio.cash_balance).toFixed(2).replace('.', ',')} €
                </div>
              </div>
              <div style={{ backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', padding: '0.85rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.7rem', color: '#8e8e93', fontWeight: 600 }}>VALEUR TOTALE</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem', color: '#34c759' }}>
                  {Number(simPortfolio.total_value).toFixed(2).replace('.', ',')} €
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem' }}>
              Positions Actuelles de l'IA ({simPositions.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {simPositions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#636366', backgroundColor: '#1c1c1e', borderRadius: '12px' }}>
                  L'IA n'a pas encore ouvert de position. Cliquez sur <strong>« Déclencher Cycle IA »</strong>.
                </div>
              ) : (
                simPositions.map((p) => {
                  const isProfit = Number(p.pnl) >= 0;
                  return (
                    <div key={p.id} onClick={() => setChartStock(p)} style={{ backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: '12px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '1rem' }}>{p.company_name}</strong>
                          <span style={{ color: '#2997ff', fontSize: '0.8rem', marginLeft: '0.4rem' }}>{p.ticker}</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{p.current_value} €</div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#000', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                        <div>
                          <span style={{ color: '#8e8e93' }}>Prix d'achat unitaire :</span>
                          <div style={{ fontWeight: 700, color: '#f5f5f7' }}>{p.average_buy_price} €</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#8e8e93' }}>Cours en direct :</span>
                          <div style={{ fontWeight: 700, color: '#2997ff' }}>{p.current_price} €</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ color: '#8e8e93' }}>Parts : {p.shares}</span>
                        <div style={{ color: isProfit ? '#34c759' : '#ff3b30', fontWeight: 800 }}>
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
        {/* ONGLET 3 : MON PORTEFEUILLE RÉEL (EN-TÊTE COMPTE BANCAIRE) */}
        {/* ======================================================== */}
        {activeTab === 'MY_PORTFOLIO' && (
          <div>
            
            {/* EN-TÊTE STYLE BANQUE / VALEUR TOTALE */}
            <div style={{
              backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: '16px',
              padding: '1.25rem', marginBottom: '1.5rem', background: 'linear-gradient(180deg, #2c2c2e 0%, #1c1c1e 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#8e8e93', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                <Landmark size={14} color="#2997ff" />
                <span>Valeur Totale de mes Actions</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                  {totalManualValue.toFixed(2).replace('.', ',')} €
                </div>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                  padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800,
                  backgroundColor: manualPnL >= 0 ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)',
                  color: manualPnL >= 0 ? '#34c759' : '#ff3b30'
                }}>
                  {manualPnL >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {manualPnL >= 0 ? '+' : ''}{manualPnL.toFixed(2).replace('.', ',')} € ({manualPnLPercent.toFixed(1)}%)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #2c2c2e', fontSize: '0.75rem', color: '#8e8e93' }}>
                <div>Total investi : <strong style={{ color: '#fff' }}>{totalManualCost.toFixed(2).replace('.', ',')} €</strong></div>
                <div>Positions : <strong style={{ color: '#2997ff' }}>{manualPositions.length} lignes</strong></div>
              </div>
            </div>

            {/* FORMULAIRE RECHERCHE */}
            <div style={{ backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Ajouter une action à surveiller</span>

              <div style={{ position: 'relative', width: '100%', marginBottom: '0.75rem' }}>
                <Search size={16} color="#8e8e93" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={portfolioSearchQuery}
                  onChange={e => setPortfolioSearchQuery(e.target.value)}
                  placeholder="Tapez (ex: Dassault, DSY.PA, Nvidia, Airbus...)"
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.4rem', backgroundColor: '#000', border: '1px solid #3a3a3c', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />

                {portfolioSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, backgroundColor: '#2c2c2e', border: '1px solid #3a3a3c', borderRadius: '8px', zIndex: 20, maxHeight: '200px', overflowY: 'auto' }}>
                    {portfolioSuggestions.map(s => (
                      <div
                        key={s.ticker}
                        onClick={() => handleSelectStock(s)}
                        style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #3a3a3c', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{s.name}</strong>
                          <span style={{ color: '#2997ff', fontSize: '0.8rem', marginLeft: '0.3rem' }}>({s.ticker})</span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#34c759', fontSize: '0.85rem' }}>{s.priceFormatted} €</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedStock && (
                <form onSubmit={handleAddManual} style={{ backgroundColor: '#2c2c2e', padding: '0.85rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#2997ff' }}>{selectedStock.name} ({selectedStock.ticker})</span>
                    <button
                      type="button"
                      onClick={() => setNewPrice(selectedStock.price.toString())}
                      style={{ background: 'none', border: 'none', color: '#34c759', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                      Cours actuel : {selectedStock.price} €
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#8e8e93' }}>Parts détenues</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={newShares}
                        onChange={e => setNewShares(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', backgroundColor: '#000', border: '1px solid #3a3a3c', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#8e8e93' }}>Prix d'achat (€)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        placeholder={selectedStock.price.toString()}
                        style={{ width: '100%', padding: '0.55rem', backgroundColor: '#000', border: '1px solid #3a3a3c', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '0.65rem', backgroundColor: '#0071e3', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                    Enregistrer dans mon Portefeuille
                  </button>
                </form>
              )}
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem' }}>
              Vos Lignes en Portefeuille ({manualPositions.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {manualPositions.map((p) => {
                const isProfit = Number(p.pnl) >= 0;
                return (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: '12px',
                      padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem'
                    }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '1.05rem' }}>{p.company_name}</strong>
                          <span style={{ color: '#2997ff', fontSize: '0.8rem', fontWeight: 700 }}>{p.ticker}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#8e8e93' }}>Quantité : {p.shares} actions</span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{p.current_value} €</div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                          padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800,
                          backgroundColor: isProfit ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)',
                          color: isProfit ? '#34c759' : '#ff3b30', marginTop: '0.15rem'
                        }}>
                          {isProfit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isProfit ? '+' : ''}{p.pnl} € ({p.pnl_percent}%)
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr',
                      backgroundColor: '#000', border: '1px solid #2c2c2e', borderRadius: '8px',
                      padding: '0.6rem 0.8rem', fontSize: '0.75rem'
                    }}>
                      <div>
                        <span style={{ color: '#8e8e93', display: 'block', marginBottom: '0.15rem' }}>Prix d'achat unitaire</span>
                        <strong style={{ fontSize: '0.9rem', color: '#f5f5f7' }}>{p.average_buy_price} €</strong>
                      </div>
                      <div style={{ textAlign: 'right', borderLeft: '1px solid #2c2c2e', paddingLeft: '0.8rem' }}>
                        <span style={{ color: '#8e8e93', display: 'block', marginBottom: '0.15rem' }}>Cours actuel en direct</span>
                        <strong style={{ fontSize: '0.9rem', color: '#2997ff' }}>{p.current_price} €</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.2rem' }}>
                      <button
                        onClick={() => setChartStock(p)}
                        style={{ background: 'none', border: 'none', color: '#2997ff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <LineChart size={14} /> Voir le graphique Bourse
                      </button>

                      <button
                        onClick={() => handleDeleteManual(p.id)}
                        style={{ background: 'none', border: 'none', color: '#ff453a', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Trash2 size={14} /> Retirer
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL GRAPHIQUE APPLE BOURSE EXACT (COMME DSY.PA) */}
      {/* ======================================================== */}
      {chartStock && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#000000', borderTop: '1px solid #2c2c2e', borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
            width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto', padding: '1.25rem 1rem', boxSizing: 'border-box'
          }}>
            
            {/* EN-TÊTE EXACT APPLE BOURSE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <button
                  onClick={() => setChartStock(null)}
                  style={{ background: '#1c1c1e', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '0.5rem' }}>
                  <X size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{chartStock.ticker}</h1>
                  <span style={{ color: '#8e8e93', fontSize: '0.9rem', fontWeight: 500 }}>{chartStock.name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{chartStock.priceFormatted || chartStock.price || chartStock.current_price} €</span>
                  <span style={{ fontSize: '0.95rem', color: (chartStock.changeRaw ?? 1) >= 0 ? '#34c759' : '#ff3b30', fontWeight: 800 }}>
                    {chartStock.change || `+${chartStock.pnl_percent}%`}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#8e8e93', marginTop: '0.1rem' }}>
                  {chartStock.place || 'Paris · EUR'}
                </div>
              </div>
            </div>

            {/* BARRE DE PÉRIODE OFFICIELLE 1J, 1S, 1M, 3M, 6M, 1A */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.3rem', backgroundColor: '#1c1c1e', padding: '0.25rem', borderRadius: '10px', margin: '0.85rem 0' }}>
              {(['1D', '1W', '1M', '3M', '6M', '1Y'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  style={{
                    padding: '0.45rem 0', borderRadius: '8px', border: 'none',
                    backgroundColor: chartPeriod === p ? '#3a3a3c' : 'transparent',
                    color: chartPeriod === p ? '#ffffff' : '#8e8e93',
                    fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', textAlign: 'center'
                  }}>
                  {p === '1D' ? '1J' : p === '1W' ? '1S' : p === '1M' ? '1M' : p === '3M' ? '3M' : p === '6M' ? '6M' : '1A'}
                </button>
              ))}
            </div>

            {/* LE GRAPHIQUE PRÉCIS APPLE BOURSE */}
            {chartStock.history ? (
              renderAppleStocksExactChart(chartStock.history[chartPeriod], (chartStock.changeRaw ?? 1) >= 0)
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#636366' }}>Chargement du graphique...</div>
            )}

            {/* GRILLE DE DONNÉES FINANCIÈRES CLIQUABLES AVEC DÉFINITIONS */}
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid #1c1c1e', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#8e8e93', textTransform: 'uppercase', fontWeight: 700 }}>
                  Statistiques Clés (Toucher pour la définition)
                </span>
                <HelpCircle size={14} color="#2997ff" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem 0.5rem', fontSize: '0.8rem' }}>
                
                {[
                  { label: 'Ouverture', val: `${chartStock.open || '25,22'} €` },
                  { label: 'Vol.', val: chartStock.volume || '360,1 k' },
                  { label: 'H 52 sem.', val: chartStock.h52 || '38,20 €' },
                  { label: 'Max.', val: `${chartStock.high || '25,64'} €` },
                  { label: 'PER', val: chartStock.per || '25,77' },
                  { label: 'B 52 sem.', val: chartStock.b52 || '24,10 €' },
                  { label: 'Min.', val: `${chartStock.low || '25,16'} €` },
                  { label: 'Cap. bours.', val: chartStock.marketCap || '33,53 Md €' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveDefinition(METRIC_DEFINITIONS[item.label] || null)}
                    style={{
                      backgroundColor: '#1c1c1e', padding: '0.6rem 0.5rem', borderRadius: '8px',
                      cursor: 'pointer', border: '1px solid #2c2c2e', transition: '0.15s'
                    }}>
                    <span style={{ color: '#8e8e93', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      {item.label} <Info size={10} color="#2997ff" />
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: '#fff', marginTop: '0.15rem', display: 'block' }}>
                      {item.val}
                    </strong>
                  </div>
                ))}

              </div>
            </div>

            {/* AVIS & CATALYSEUR IA */}
            <div style={{ backgroundColor: '#1c1c1e', padding: '0.85rem', borderRadius: '12px', fontSize: '0.85rem', margin: '1rem 0', border: '1px solid #2c2c2e' }}>
              <span style={{ color: '#2997ff', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                🎯 Synthèse & Diagnostic de l'IA
              </span>
              <p style={{ margin: 0, color: '#f5f5f7', lineHeight: '1.4' }}>
                {chartStock.aiAdvice || "Surveillance algorithmique continue assurée par Gemini & Groq."}
              </p>
            </div>

            <button
              onClick={() => setChartStock(null)}
              style={{ width: '100%', padding: '0.8rem', backgroundColor: '#2c2c2e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
              Fermer
            </button>

          </div>
        </div>
      )}

      {/* POPUP DÉFINITION ÉDUCATIVE */}
      {activeDefinition && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#1c1c1e', border: '1px solid #3a3a3c', borderRadius: '16px', maxWidth: '380px', width: '100%', padding: '1.25rem', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2997ff' }}>
                <Info size={18} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{activeDefinition.title}</h4>
              </div>
              <button onClick={() => setActiveDefinition(null)} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: '#f5f5f7', lineHeight: '1.45' }}>
              {activeDefinition.desc}
            </p>

            <button
              onClick={() => setActiveDefinition(null)}
              style={{ marginTop: '1.25rem', width: '100%', padding: '0.65rem', backgroundColor: '#0071e3', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {/* MODAL HISTORIQUE DES ORDRES IA */}
      {historyOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#1c1c1e', border: '1px solid #3a3a3c', borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '1.25rem', boxSizing: 'border-box', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="#2997ff" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Journal des Ordres de l'IA</h3>
              </div>
              <button onClick={() => setHistoryOpen(false)} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {simPositions.length === 0 ? (
                <p style={{ color: '#636366', fontSize: '0.85rem', textAlign: 'center' }}>Aucun ordre exécuté pour l'instant.</p>
              ) : (
                simPositions.map((p, idx) => (
                  <div key={idx} style={{ backgroundColor: '#2c2c2e', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#34c759' }}>ACHAT IA</strong>
                      <div style={{ fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>{p.company_name} ({p.ticker})</div>
                      <span style={{ fontSize: '0.7rem', color: '#8e8e93' }}>Quantité : {p.shares} @ {p.average_buy_price} €</span>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 800, color: '#2997ff' }}>
                      {p.current_value} €
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setHistoryOpen(false)}
              style={{ width: '100%', marginTop: '1rem', padding: '0.65rem', backgroundColor: '#0071e3', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
