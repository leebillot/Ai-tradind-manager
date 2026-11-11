'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, Bot, TrendingUp, RefreshCw, Zap, Layers, 
  RotateCcw, Globe, LogOut, CheckCircle, ShieldAlert, 
  Sparkles, Plus, Trash2, ArrowUpRight, ArrowDownRight, Clock,
  Search, Flame, Rocket
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

  // Données dynamiques
  const [markets, setMarkets] = useState<any[]>([]);
  const [manualPositions, setManualPositions] = useState<any[]>([]);
  const [simPortfolio, setSimPortfolio] = useState<any>({ cash_balance: 500, total_value: 500 });
  const [simPositions, setSimPositions] = useState<any[]>([]);

  // Filtres Onglet 1 (Analyse du Marché)
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'US' | 'PARIS'>('ALL');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');

  // Recherche intelligente Onglet 3 (Mon Portefeuille)
  const [portfolioSearchQuery, setPortfolioSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [newShares, setNewShares] = useState('5');
  const [newPrice, setNewPrice] = useState('');
  const [newThreshold, setNewThreshold] = useState('3.0');

  // Authentification
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // 1. Initialisation Session
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

  // 2. Chargement des données du marché et des portefeuilles
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

  // Connexion / Inscription
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
          setStatusMsg('Compte créé avec succès ! Connecté.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setStatusMsg('Connexion réussie.');
      }
    } catch (err: any) {
      setStatusMsg('Erreur auth : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sélection intelligente dans Mon Portefeuille
  const handleSelectStock = (stock: any) => {
    setSelectedStock(stock);
    setNewPrice(stock.price.toString());
    setPortfolioSearchQuery('');
  };

  // Ajout dans Mon Portefeuille
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

  // Supprimer de Mon Portefeuille
  const handleDeleteManual = async (posId: string) => {
    if (!user) return;
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_MANUAL_POSITION', userId: user.id, positionId: posId })
    });
    fetchData();
  };

  // Lancer le cycle d'arbitrage de la simulation 500 €
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

  // Réinitialiser la simulation 500 €
  const handleResetSimulation = async () => {
    if (!user || !confirm('Réinitialiser la simulation à 500 € ?')) return;
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESET_SIMULATION', userId: user.id })
    });
    fetchData();
  };

  // Filtrage intelligent Onglet Analyse
  const filteredMarkets = markets.filter(m => {
    const matchFilter = marketFilter === 'ALL' || m.market === marketFilter;
    const query = marketSearchQuery.toLowerCase().trim();
    const matchSearch = !query || 
      m.name.toLowerCase().includes(query) || 
      m.ticker.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query);
    return matchFilter && matchSearch;
  });

  // Autocomplétion intelligente Onglet Portefeuille
  const portfolioSuggestions = portfolioSearchQuery.trim() === '' ? [] : markets.filter(m => 
    m.name.toLowerCase().includes(portfolioSearchQuery.toLowerCase()) ||
    m.ticker.toLowerCase().includes(portfolioSearchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(portfolioSearchQuery.toLowerCase())
  );

  // ÉCRAN AUTH SI NON CONNECTÉ
  if (!user) {
    return (
      <div style={{ backgroundColor: '#090d16', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Bot size={28} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>AI Trading Manager</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Connectez-vous pour accéder au détecteur de pépites et au suivi de portefeuille en direct.
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
                style={{ width: '100%', padding: '0.7rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '0.2rem' }}
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
                style={{ width: '100%', padding: '0.7rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '0.2rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>

          {statusMsg && <p style={{ color: '#38bdf8', fontSize: '0.85rem', marginTop: '1rem' }}>{statusMsg}</p>}

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '1.5rem' }}>
            {isSignUp ? 'Vous avez déjà un compte ?' : "Vous n'avez pas de compte ?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', marginLeft: '0.4rem', fontWeight: 'bold' }}>
              {isSignUp ? 'Se connecter' : "Créer un compte"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER AVEC MENU 3 TRAITS */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: '#111827', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={22} color="#38bdf8" />
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>AI Trading Manager</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            title="Se déconnecter"
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* MENU TIROIR */}
      {menuOpen && (
        <div style={{ backgroundColor: '#172033', borderBottom: '1px solid #334155', padding: '1rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveTab('MARKETS'); setMenuOpen(false); }}
            style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'MARKETS' ? '#2563eb' : '#1e293b', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            1. Détecteur de Pépites & Analyse
          </button>
          <button
            onClick={() => { setActiveTab('AUTO_SIM'); setMenuOpen(false); }}
            style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'AUTO_SIM' ? '#2563eb' : '#1e293b', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            2. Simulation Automatique (500 €)
          </button>
          <button
            onClick={() => { setActiveTab('MY_PORTFOLIO'); setMenuOpen(false); }}
            style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'MY_PORTFOLIO' ? '#2563eb' : '#1e293b', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            3. Mon Portefeuille Réel & Alertes
          </button>
        </div>
      )}

      {/* BANDEAU DE STATUT */}
      {statusMsg && (
        <div style={{ backgroundColor: '#131b2e', borderBottom: '1px solid #2563eb', padding: '0.75rem 1.5rem', fontSize: '0.85rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* CONTENU PRINCIPAL */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>

        {/* ======================================================== */}
        {/* ONGLET 1 : DÉTECTEUR DE PÉPITES & ANALYSE DYNAMIQUE */}
        {/* ======================================================== */}
        {activeTab === 'MARKETS' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={24} color="#f59e0b" />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Détecteur de Pépites & Plus Fortes Hausses</h2>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  Classement dynamique des actions qui explosent le plus aujourd'hui (US & Paris).
                </p>
              </div>

              {/* SÉLECTEUR BOURSE */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['ALL', 'US', 'PARIS'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setMarketFilter(f)}
                    style={{
                      padding: '0.5rem 0.9rem', borderRadius: '6px', border: '1px solid #334155',
                      backgroundColor: marketFilter === f ? '#2563eb' : '#111827', color: '#fff',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                    }}>
                    {f === 'ALL' ? 'Toutes les Pépites' : f === 'US' ? 'Wall Street (New York)' : 'Paris (Euronext)'}
                  </button>
                ))}
              </div>
            </div>

            {/* BARRE DE RECHERCHE INTELLIGENTE */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={marketSearchQuery}
                onChange={e => setMarketSearchQuery(e.target.value)}
                placeholder="Recherche intelligente (ex: IonQ, AppLovin, SpaceMobile, Vusion, Nvidia, ASTS...)"
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '10px', color: '#fff', fontSize: '0.9rem' }}
              />
            </div>

            {/* GRILLE DES ACTIONS CLASSÉES PAR RENDEMENT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
              {filteredMarkets.map((m) => (
                <div key={m.ticker} style={{
                  backgroundColor: '#111827',
                  border: m.isSurge ? '1px solid #f59e0b' : '1px solid #1f2937',
                  borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'
                }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{m.ticker}</span>
                        <span style={{ fontSize: '0.7rem', backgroundColor: '#1e293b', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#94a3b8' }}>
                          {m.market === 'US' ? 'WALL STREET' : 'PARIS'}
                        </span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {m.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.1rem' }}>{m.name}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{m.price} €</div>
                      <div style={{ fontSize: '0.9rem', color: m.changeRaw >= 0 ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                        {m.change}
                      </div>
                    </div>
                  </div>

                  {/* BADGE CONSEIL IA */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', borderRadius: '8px',
                    backgroundColor: m.isSurge ? 'rgba(245, 158, 11, 0.15)' : m.aiSignal.includes('FORT') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    border: `1px solid ${m.isSurge ? '#f59e0b' : m.aiSignal.includes('FORT') ? '#10b981' : '#38bdf8'}`
                  }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: m.isSurge ? '#f59e0b' : m.aiSignal.includes('FORT') ? '#10b981' : '#38bdf8' }}>
                      {m.aiSignal}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Confiance : <strong style={{ color: '#fff' }}>{m.aiConfidence}%</strong>
                    </span>
                  </div>

                  {/* LA PETITE PHRASE EXPLICATIVE DE L'IA */}
                  <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                    <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      💡 Avis de l'IA sur cette action
                    </div>
                    {m.aiAdvice}
                  </div>

                  {/* CATALYSEUR & TENDANCE */}
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid #1f2937', paddingTop: '0.5rem' }}>
                    <div>⚡ <strong>Pourquoi elle monte :</strong> {m.catalyst}</div>
                    <div style={{ marginTop: '0.2rem' }}>📈 <strong>Tendance :</strong> {m.trend}</div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 2 : SIMULATION AUTOMATIQUE (500 € SANS POINTS VISIBLES) */}
        {/* ======================================================== */}
        {activeTab === 'AUTO_SIM' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Simulation Autonome (500 €)</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  L'IA investit sur les plus fortes poussées du marché pour maximiser le rendement.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={handleRunSimulation}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.7rem 1.25rem', backgroundColor: '#10b981', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
                  }}>
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Recherche des pépites en cours...' : 'Déclencher Cycle IA'}
                </button>
                <button
                  onClick={handleResetSimulation}
                  title="Réinitialiser à 500 €"
                  style={{ padding: '0.7rem', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}>
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* BANDEAU FINANCIER */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>CASH DISPONIBLE</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  {Number(simPortfolio.cash_balance).toFixed(2)} €
                </div>
              </div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>VALEUR DU PORTEFEUILLE</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem', color: '#10b981' }}>
                  {Number(simPortfolio.total_value).toFixed(2)} €
                </div>
              </div>
            </div>

            {/* TABLEAU DES POSITIONS DÉTENUES PAR L'IA */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Pépites et Actions Détenues par l'IA ({simPositions.length})
            </h3>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
              {simPositions.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  L'IA n'a pas encore pris de positions. Cliquez sur <strong>« Déclencher Cycle IA »</strong> ci-dessus.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#172033', color: '#94a3b8', borderBottom: '1px solid #1f2937', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Action</th>
                      <th style={{ padding: '0.9rem' }}>Parts</th>
                      <th style={{ padding: '0.9rem' }}>Prix Achat / Actuel</th>
                      <th style={{ padding: '0.9rem' }}>Valeur</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Gain / Perte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simPositions.map((p) => {
                      const isProfit = Number(p.pnl) >= 0;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>{p.company_name} ({p.ticker})</td>
                          <td style={{ padding: '1rem' }}>{p.shares}</td>
                          <td style={{ padding: '1rem' }}>{p.average_buy_price} € → {p.current_price} €</td>
                          <td style={{ padding: '1rem', fontWeight: 700 }}>{p.current_value} €</td>
                          <td style={{ padding: '1rem 1.25rem', color: isProfit ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                            {isProfit ? '+' : ''}{p.pnl} € ({p.pnl_percent}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 3 : MON PORTEFEUILLE RÉEL (RECHERCHE FACILE) */}
        {/* ======================================================== */}
        {activeTab === 'MY_PORTFOLIO' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Mon Vrai Portefeuille & Sentinelle 24h/24</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                Cherchez vos vraies actions dans la barre ci-dessous pour activer la surveillance intelligente.
              </p>
            </div>

            {/* FORMULAIRE AVEC RECHERCHE INTELLIGENTE */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Ajouter une action à surveiller</h3>

              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={portfolioSearchQuery}
                  onChange={e => setPortfolioSearchQuery(e.target.value)}
                  placeholder="Tapez le nom d'une action (ex: SpaceMobile, IonQ, Nvidia, LVMH, Total, Vusion...)"
                  style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                />

                {/* SUGGESTIONS DÉROULANTES */}
                {portfolioSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, backgroundColor: '#172033', border: '1px solid #334155', borderRadius: '8px', zIndex: 10, maxHeight: '220px', overflowY: 'auto' }}>
                    {portfolioSuggestions.map(s => (
                      <div
                        key={s.ticker}
                        onClick={() => handleSelectStock(s)}
                        style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{s.name}</strong> <span style={{ color: '#38bdf8' }}>({s.ticker})</span>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>{s.category}</span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>{s.price} € ({s.change})</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CONFIGURATION APRES SELECTION */}
              {selectedStock && (
                <form onSubmit={handleAddManual} style={{ backgroundColor: '#172033', padding: '1rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Action sélectionnée</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.3rem', color: '#38bdf8' }}>
                      {selectedStock.name} ({selectedStock.ticker})
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nombre de parts</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newShares}
                      onChange={e => setNewShares(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '0.2rem' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Prix d'achat unitaire (€)</label>
                      <button
                        type="button"
                        onClick={() => setNewPrice(selectedStock.price.toString())}
                        style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}>
                        Cours actuel ({selectedStock.price}€)
                      </button>
                    </div>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      placeholder={selectedStock.price.toString()}
                      style={{ width: '100%', padding: '0.65rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '0.2rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '0.7rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Enregistrer
                  </button>
                </form>
              )}
            </div>

            {/* LISTE DES ACTIONS RÉELLES */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Vos Actions Actuellement Surveillées ({manualPositions.length})
            </h3>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
              {manualPositions.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  Aucune action suivie pour l'instant. Utilisez la barre de recherche ci-dessus pour ajouter vos actions.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#172033', color: '#94a3b8', borderBottom: '1px solid #1f2937', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Actif</th>
                      <th style={{ padding: '0.9rem' }}>Parts</th>
                      <th style={{ padding: '0.9rem' }}>Achat / Actuel</th>
                      <th style={{ padding: '0.9rem' }}>Valeur</th>
                      <th style={{ padding: '0.9rem' }}>Gain / Perte</th>
                      <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Supprimer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualPositions.map((p) => {
                      const isProfit = Number(p.pnl) >= 0;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>
                            {p.company_name} ({p.ticker})
                            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'normal', marginTop: '0.2rem' }}>
                              💡 {p.aiAdvice}
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>{p.shares}</td>
                          <td style={{ padding: '1rem' }}>{p.average_buy_price} € → {p.current_price} €</td>
                          <td style={{ padding: '1rem', fontWeight: 700 }}>{p.current_value} €</td>
                          <td style={{ padding: '1rem', color: isProfit ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                            {isProfit ? '+' : ''}{p.pnl} € ({p.pnl_percent}%)
                          </td>
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteManual(p.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
