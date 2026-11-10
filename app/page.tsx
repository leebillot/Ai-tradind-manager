'use client';

import { useState, useEffect } from 'react';
import { 
  Bot, TrendingUp, RefreshCw, Zap, ShieldAlert, 
  ArrowUpRight, ArrowDownRight, Wallet, CheckCircle, RotateCcw
} from 'lucide-react';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<any>({ cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' });
  const [positions, setPositions] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const refreshData = async () => {
    try {
      const res = await fetch('/api/scan');
      const data = await res.json();
      if (data.portfolio) setPortfolio(data.portfolio);
      if (data.positions) setPositions(data.positions);
      if (data.analyses) setAnalyses(data.analyses);
      if (data.markets) setMarkets(data.markets);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAction = async (action: string, payload: any = {}) => {
    setLoading(true);
    setStatusMsg('Traitement en cours...');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();
      
      // Mise à jour instantanée sans attendre
      if (data.portfolio) setPortfolio(data.portfolio);
      if (data.positions) setPositions(data.positions);
      if (data.analyses) setAnalyses(data.analyses);
      if (data.markets) setMarkets(data.markets);
      if (data.message) setStatusMsg(data.message);
    } catch (err: any) {
      setStatusMsg('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAuto = portfolio?.trading_mode === 'AUTO';

  return (
    <div style={{ backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#3b82f6', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                <Bot size={22} color="#ffffff" />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>AI Trading Manager</h1>
            </div>
            <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Supervision autonome de portefeuille multi-IA (Gemini & Groq / Llama)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => handleAction('SET_MODE', { mode: isAuto ? 'MANUAL' : 'AUTO' })}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: isAuto ? '#dc2626' : '#10b981',
                color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}>
              <Zap size={16} />
              {isAuto ? 'Désactiver AUTO' : 'Activer Mode AUTO'}
            </button>

            <button
              onClick={() => handleAction('SCAN')}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155',
                padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
              }}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Analyse...' : 'Lancer Scan IA'}
            </button>

            <button
              onClick={() => { if (confirm('Remettre le solde à 500 € ?')) handleAction('RESET'); }}
              disabled={loading}
              title="Réinitialiser"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
                padding: '0.65rem', borderRadius: '8px', cursor: 'pointer'
              }}>
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* NOTIFICATION STATUS */}
        {statusMsg && (
          <div style={{ backgroundColor: '#1e293b', borderLeft: '4px solid #38bdf8', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {statusMsg}
          </div>
        )}

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>CASH DISPONIBLE</span>
              <Wallet size={16} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
              {portfolio?.cash_balance ?? 500} €
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>VALEUR TOTALE</span>
              <TrendingUp size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#10b981' }}>
              {portfolio?.total_portfolio_value ?? 500} €
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>STATUT SYSTÈME</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isAuto ? '#10b981' : '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.75rem', color: isAuto ? '#10b981' : '#f59e0b' }}>
              {isAuto ? 'MODE AUTO ACTIF' : 'MODE MANUEL'}
            </div>
          </div>

        </div>

        {/* SECTION 1: ANALYSES IA MULTI-MODÈLES (Toujours visibles) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Bot size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Analyses & Recommandations Multi-IA</h2>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#1e293b', padding: '0.2rem 0.6rem', borderRadius: '12px', color: '#94a3b8' }}>
              {analyses.length} rapports
            </span>
          </div>

          {analyses.length === 0 ? (
            <div style={{ backgroundColor: '#111827', border: '1px dashed #334155', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              Cliquez sur « Lancer Scan IA » pour obtenir les prédictions en direct de Gemini et Groq.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {analyses.map((item, idx) => (
                <div key={idx} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>{item.ticker}</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#1e293b', color: '#94a3b8' }}>
                        {item.ai_name}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px',
                      backgroundColor: item.signal === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: item.signal === 'BUY' ? '#10b981' : '#f59e0b',
                      border: `1px solid ${item.signal === 'BUY' ? '#10b981' : '#f59e0b'}`
                    }}>
                      {item.signal === 'BUY' ? 'ACHAT FORT' : 'NEUTRE'}
                    </span>
                  </div>

                  {/* Jauge de confiance */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                      <span>Confiance IA</span>
                      <strong style={{ color: '#f8fafc' }}>{item.confidence}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.confidence}%`, height: '100%', backgroundColor: item.confidence > 80 ? '#10b981' : '#38bdf8' }} />
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                    {item.reasoning}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: POSITIONS EN COURS */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
            Positions en Portefeuille ({positions.length})
          </h2>

          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
            {positions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Aucune position ouverte. Passez en mode AUTO ou effectuez un achat.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a2234', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Actif</th>
                    <th style={{ padding: '0.85rem' }}>Parts</th>
                    <th style={{ padding: '0.85rem' }}>Prix Achat</th>
                    <th style={{ padding: '0.85rem' }}>Valeur</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>
                        {pos.company_name} <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({pos.ticker})</span>
                      </td>
                      <td style={{ padding: '1rem' }}>{pos.shares}</td>
                      <td style={{ padding: '1rem' }}>{pos.average_buy_price} €</td>
                      <td style={{ padding: '1rem', color: '#10b981', fontWeight: 700 }}>{pos.current_value} €</td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleAction('SELL', { positionId: pos.id })}
                          disabled={loading}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.4rem 0.8rem',
                            borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                          }}>
                          Clôturer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* SECTION 3: MARCHÉS EN DIRECT */}
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Marchés Suivis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {markets.map((m) => (
              <div key={m.ticker} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.ticker}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{m.price} €</div>
                  <div style={{ fontSize: '0.8rem', color: m.change.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {m.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
