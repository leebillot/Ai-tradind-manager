'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, Bot, TrendingUp, RefreshCw, Zap, Layers, 
  RotateCcw, Globe, LogOut, CheckCircle, ShieldAlert, 
  Sparkles, Plus, Trash2, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, ''),
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '')
);

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

  // Filtre Bourse
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'US' | 'PARIS'>('ALL');

  // Formulaire d'ajout d'action dans Mon Portefeuille
  const [newTicker, setNewTicker] = useState('MC.PA');
  const [newShares, setNewShares] = useState('2');
  const [newPrice, setNewPrice] = useState('610');
  const [newThreshold, setNewThreshold] = useState('3.0');

  // Formulaire Auth
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // 1. Initialisation de la session utilisateur
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

  // 2. Chargement des données
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

  // Ajout manuel d'une position réelle
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const m = markets.find(x => x.ticker === newTicker);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MANUAL_POSITION',
          userId: user.id,
          ticker: newTicker,
          name: m?.name || newTicker,
          shares: newShares,
          averageBuyPrice: newPrice,
          alertThreshold: newThreshold
        })
      });
      const data = await res.json();
      setStatusMsg(data.message || 'Position ajoutée.');
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une action du vrai portefeuille
  const handleDeleteManual = async (posId: string) => {
    if (!user) return;
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_MANUAL_POSITION', userId: user.id, positionId: posId })
    });
    fetchData();
  };

  // Déclencher un cycle de la simulation 500 €
  const handleRunSimulation = async () => {
    if (!user) return;
    setLoading(true);
    setStatusMsg('Gemini et Groq analysent les opportunités...');
    try {
      await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'AUTO_SIMULATION_STEP', userId: user.id })
      });
      await fetchData();
      setStatusMsg('La simulation a ajusté ses investissements.');
    } finally {
      setLoading(false);
    }
  };

  // Reset de la simulation 500 €
  const handleResetSimulation = async () => {
    if (!user || !confirm('Réinitialiser la simulation à 500 € ?')) return;
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESET_SIMULATION', userId: user.id })
    });
    fetchData();
  };

  // ÉCRAN DE CONNEXION OBLIGATOIRE (POUR VERROUILLER LA MÉMOIRE)
  if (!user) {
    return (
      <div style={{ backgroundColor: '#090d16', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Bot size={28} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>AI Trading Manager</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Connectez-vous pour débloquer votre sentinelle boursière 24h/24 et sécuriser votre mémoire permanente.
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

  // INTERFACE PRINCIPALE CONNECTÉE
  return (
    <div style={{ backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER AVEC MENU 3 TRAITS */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: '#111827', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* BOUTON 3 TRAITS */}
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

      {/* MENU TIROIR (SLIDE-OUT) */}
      {menuOpen && (
        <div style={{ backgroundColor: '#172033', borderBottom: '1px solid #334155', padding: '1rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveTab('MARKETS'); setMenuOpen(false); }}
            style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'MARKETS' ? '#2563eb' : '#1e293b', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            1. Analyse du Marché
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

      {/* CONTENU PRINCIPAL */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        
        {/* ======================================================== */}
        {/* ONGLET 1 : ANALYSE DU MARCHÉ (ACCUEIL PAR DÉFAUT) */}
        {/* ======================================================== */}
        {activeTab === 'MARKETS' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Analyse & Prédictions du Marché</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  Tendances de fond, catalyseurs financiers et alertes anticipées par Gemini & Groq.
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
                    {f === 'ALL' ? 'Tout le Marché' : f === 'US' ? 'Wall Street (New York)' : 'Paris (Euronext / CAC 40)'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {markets.filter(m => marketFilter === 'ALL' || m.market === marketFilter).map((m) => (
                <div key={m.ticker} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{m.ticker}</span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', backgroundColor: '#1e293b', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#94a3b8' }}>
                        {m.market === 'US' ? 'NYSE / NASDAQ' : 'EURONEXT PARIS'}
                      </span>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{m.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{m.price} €</div>
                      <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>{m.change}</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      ⚡ Prochain Catalyseur / Bilan
                    </div>
                    <div style={{ color: '#cbd5e1' }}>{m.catalyst}</div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    <strong style={{ color: '#f8fafc' }}>Tendance IA : </strong>{m.riskTrend}
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
                  Gemini et Groq gèrent ce capital virtuel de façon autonome avec arbitrage dynamique.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={handleRunSimulation}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.1rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'IA en réflexion...' : 'Déclencher Cycle IA'}
                </button>
                <button
                  onClick={handleResetSimulation}
                  style={{ padding: '0.65rem', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}>
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
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>VALEUR TOTALE DU PORTEFEUILLE</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem', color: '#10b981' }}>
                  {Number(simPortfolio.total_value).toFixed(2)} €
                </div>
              </div>
            </div>

            {/* POSITIONS DE LA SIMULATION */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Actions Détenues par l'IA ({simPositions.length})
            </h3>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
              {simPositions.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  L'IA n'a pas encore ouvert de position. Cliquez sur « Déclencher Cycle IA ».
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#172033', color: '#94a3b8', borderBottom: '1px solid #1f2937', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Action</th>
                      <th style={{ padding: '0.9rem' }}>Parts</th>
                      <th style={{ padding: '0.9rem' }}>Achat / Actuel</th>
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
        {/* ONGLET 3 : MON PORTEFEUILLE RÉEL & SENTINELLE 24H/24 */}
        {/* ======================================================== */}
        {activeTab === 'MY_PORTFOLIO' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Mon Vrai Portefeuille & Sentinelle 24h/24</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                Renseignez ici vos vraies actions. L'IA surveille les marchés 24h/24 et vous alerte par e-mail au moindre risque de baisse ou opportunité d'arbitrage.
              </p>
            </div>

            {/* FORMULAIRE D'AJOUT DE VRAIE ACTION */}
            <form onSubmit={handleAddManual} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Action</label>
                <select
                  value={newTicker}
                  onChange={e => setNewTicker(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '0.2rem' }}>
                  {markets.map(m => (
                    <option key={m.ticker} value={m.ticker}>{m.ticker} - {m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nombre d'actions</label>
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
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Prix d'achat unitaire (€)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '0.2rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Seuil d'alerte baisse (%)</label>
                <input
                  type="number"
                  step="any"
                  value={newThreshold}
                  onChange={e => setNewThreshold(e.target.value)}
                  placeholder="3.0"
                  style={{ width: '100%', padding: '0.65rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '0.2rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ padding: '0.7rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Plus size={16} /> Ajouter à mon Portefeuille
              </button>
            </form>

            {/* LISTE DES ACTIONS RÉELLES SUIVIES */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Vos Actions Actuellement Surveillées ({manualPositions.length})
            </h3>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
              {manualPositions.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  Vous n'avez pas encore ajouté d'action à surveiller. Utilisez le formulaire ci-dessus.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#172033', color: '#94a3b8', borderBottom: '1px solid #1f2937', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Actif</th>
                      <th style={{ padding: '0.9rem' }}>Parts</th>
                      <th style={{ padding: '0.9rem' }}>Prix Achat / Actuel</th>
                      <th style={{ padding: '0.9rem' }}>Valeur</th>
                      <th style={{ padding: '0.9rem' }}>Gain / Perte</th>
                      <th style={{ padding: '0.9rem' }}>Seuil Alerte</th>
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
                              {p.catalyst}
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>{p.shares}</td>
                          <td style={{ padding: '1rem' }}>{p.average_buy_price} € → {p.current_price} €</td>
                          <td style={{ padding: '1rem', fontWeight: 700 }}>{p.current_value} €</td>
                          <td style={{ padding: '1rem', color: isProfit ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                            {isProfit ? '+' : ''}{p.pnl} € ({p.pnl_percent}%)
                          </td>
                          <td style={{ padding: '1rem', color: '#f59e0b', fontSize: '0.85rem' }}>
                            - {p.alert_threshold_pct}%
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
