'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Charger les vraies données depuis la mémoire Supabase
  const loadData = async () => {
    try {
      const res = await fetch('/api/scan');
      const data = await res.json();
      if (data.portfolio) setPortfolio(data.portfolio);
      if (data.positions) setPositions(data.positions);
      if (data.analyses) setAnalyses(data.analyses);
      if (data.markets) setMarkets(data.markets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Basculer le mode Automatique / Manuel
  const toggleMode = async (newMode: 'MANUAL' | 'AUTO') => {
    setLoading(true);
    setMessage('Exécution du mode ' + newMode + '...');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SET_MODE', mode: newMode })
      });
      const data = await res.json();
      setMessage(data.message || 'Mode mis à jour !');
      await loadData(); // Rafraîchit les vraies valeurs
    } catch (err: any) {
      setMessage('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Forcer un Scan IA & Achats
  const triggerScan = async () => {
    setLoading(true);
    setMessage('Scan des marchés et décisions IA...');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SCAN' })
      });
      const data = await res.json();
      setMessage(data.message || 'Scan terminé !');
      await loadData();
    } catch (err: any) {
      setMessage('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Réinitialiser le portefeuille à 500 €
  const resetPortfolio = async () => {
    if (!confirm('Voulez-vous réinitialiser le compte à 500 € ?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET' })
      });
      const data = await res.json();
      setMessage(data.message);
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1000px', margin: 'auto', background: '#090d16', color: '#fff', minHeight: '100vh' }}>
      <h1>🤖 AI Trading Manager</h1>
      
      {/* BANDEAU PORTEFEUILLE */}
      <div style={{ display: 'flex', gap: '1rem', background: '#131b2e', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <div>
          <small>Solde Cash Disponible</small>
          <h2>{portfolio?.cash_balance ?? '...'} €</h2>
        </div>
        <div style={{ marginLeft: '2rem' }}>
          <small>Valeur Totale Portefeuille</small>
          <h2>{portfolio?.total_portfolio_value ?? '...'} €</h2>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <small>Mode Actuel</small>
          <h2 style={{ color: portfolio?.trading_mode === 'AUTO' ? '#10b981' : '#f59e0b' }}>
            {portfolio?.trading_mode ?? 'MANUAL'}
          </h2>
        </div>
      </div>

      {/* BOUTONS D'ACTION */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => toggleMode(portfolio?.trading_mode === 'AUTO' ? 'MANUAL' : 'AUTO')}
          disabled={loading}
          style={{ padding: '0.8rem 1.5rem', background: portfolio?.trading_mode === 'AUTO' ? '#ef4444' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          {portfolio?.trading_mode === 'AUTO' ? 'Désactiver le Mode AUTO' : 'Activer le Mode AUTOMATIQUE'}
        </button>

        <button 
          onClick={triggerScan}
          disabled={loading}
          style={{ padding: '0.8rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {loading ? 'Analyse en cours...' : 'Forcer un Scan IA'}
        </button>

        <button 
          onClick={resetPortfolio}
          disabled={loading}
          style={{ padding: '0.8rem 1.5rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: 'auto' }}>
          Réinitialiser à 500 €
        </button>
      </div>

      {message && <p style={{ padding: '1rem', background: '#1e293b', borderRadius: '6px' }}>{message}</p>}

      {/* POSITIONS DÉTENUES */}
      <h3>📦 Vos Positions en Portefeuille ({positions.length})</h3>
      {positions.length === 0 ? <p style={{ color: '#888' }}>Aucune action achetée pour le moment.</p> : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th>Action</th>
              <th>Parts</th>
              <th>Prix Achat</th>
              <th>Valeur</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '0.5rem 0' }}>{p.company_name} ({p.ticker})</td>
                <td>{p.shares}</td>
                <td>{p.average_buy_price} €</td>
                <td style={{ fontWeight: 'bold', color: '#10b981' }}>{p.current_value} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ANALYSES IA */}
      <h3>🧠 Dernières Recommandations de l'IA</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {analyses.map(a => (
          <div key={a.id} style={{ background: '#131b2e', padding: '1rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{a.ticker}</strong>
              <span style={{ color: '#10b981' }}>Confiance: {a.confidence}%</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{a.ai_name}</p>
            <p style={{ fontSize: '0.9rem' }}>{a.reasoning}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
