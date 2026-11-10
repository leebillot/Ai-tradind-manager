'use client';

import { useState, useEffect } from 'react';
import { 
  Bot, TrendingUp, TrendingDown, RefreshCw, Zap, Wallet, 
  RotateCcw, Award, ArrowUpRight, ArrowDownRight, Layers, Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<any>({ cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' });
  const [positions, setPositions] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [aiScore, setAiScore] = useState<number>(1000);
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
      if (data.ai_score !== undefined) setAiScore(data.ai_score);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAction = async (action: string, payload: any = {}) => {
    setLoading(true);
    setStatusMsg('Traitement stratégique en cours...');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();

      if (data.portfolio) setPortfolio(data.portfolio);
      if (data.positions) setPositions(data.positions);
      if (data.analyses) setAnalyses(data.analyses);
      if (data.markets) setMarkets(data.markets);
      if (data.ai_score !== undefined) setAiScore(data.ai_score);
      if (data.message) setStatusMsg(data.message);
    } catch (err: any) {
      setStatusMsg('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAuto = portfolio?.trading_mode === 'AUTO';

  // Calculs financiers pour affichage
  const cash = Number(portfolio?.cash_balance ?? 500);
  const totalInvested = positions.reduce((acc, p) => acc + (Number(p.cost_basis) || 0), 0);
  const currentPositionsVal = positions.reduce((acc, p) => acc + (Number(p.current_value) || 0), 0);
  const totalPnL = currentPositionsVal - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <div style={{ backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* HEADER DE COMMANDE */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Logo & Titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', padding: '0.6rem', borderRadius: '10px', display: 'flex' }}>
              <Bot size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>AI Trading Manager</h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>Arbitrage autonome & Maximisation de score</p>
            </div>
          </div>

          {/* Score IA & Boutons d'action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* BADGE DE POINTS IA */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#131b2e', border: '1px solid #2563eb', padding: '0.5rem 0.9rem',
              borderRadius: '8px'
            }}>
              <Award size={18} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Score Points IA</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>{aiScore} pts</div>
              </div>
            </div>

            {/* Switch Mode Auto / Manuel */}
            <button
              onClick={() => handleAction('SET_MODE', { mode: isAuto ? 'MANUAL' : 'AUTO' })}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                backgroundColor: isAuto ? '#dc2626' : '#10b981',
                color: '#fff', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '8px',
                fontWeight: 700, cursor: 'pointer', transition: '0.2s', fontSize: '0.85rem'
              }}>
              <Zap size={15} />
              {isAuto ? 'Mode AUTO Actif' : 'Activer Mode AUTO'}
            </button>

            {/* Scan IA (ne touche jamais au mode en cours) */}
            <button
              onClick={() => handleAction('SCAN')}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155',
                padding: '0.65rem 1.15rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
              }}>
              <RefreshCw size={15} />
              Scan IA
            </button>

            {/* Reset */}
            <button
              onClick={() => { if (confirm('Remettre le portefeuille à 500 € ?')) handleAction('RESET'); }}
              disabled={loading}
              title="Réinitialiser"
              style={{
                backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
                padding: '0.65rem', borderRadius: '8px', cursor: 'pointer'
              }}>
              <RotateCcw size={15} />
            </button>
          </div>
        </header>

        {/* NOTIFICATION D'ARBITRAGE OU D'ACHAT */}
        {statusMsg && (
          <div style={{ backgroundColor: '#131b2e', borderLeft: '4px solid #38bdf8', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
            {statusMsg}
          </div>
        )}

        {/* BANDEAU SUPÉRIEUR GAUCHE : CASH & ARGENT PLACÉ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
          
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '0.9rem 1.1rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>CASH DISPONIBLE</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem', color: '#f8fafc' }}>
              {cash.toFixed(2)} €
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '0.9rem 1.1rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>CAPITAL PLACÉ (EN BOURSE)</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem', color: '#38bdf8' }}>
              {currentPositionsVal.toFixed(2)} €
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '0.9rem 1.1rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>VALEUR TOTALE DU COMPTE</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem', color: '#10b981' }}>
              {Number(portfolio?.total_portfolio_value ?? 500).toFixed(2)} €
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '0.9rem 1.1rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>PLUS / MOINS-VALUE GLOBALE</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem', color: totalPnL >= 0 ? '#10b981' : '#ef4444' }}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} € ({totalPnLPercent.toFixed(1)}%)
            </div>
          </div>

        </div>

        {/* 1ER BLOC MAJEUR : VOS ACTIONS ACHETÉES (AU PREMIER PLAN) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} color="#10b981" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Vos Actions Achetées ({positions.length})</h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Gains & Pertes en direct</span>
          </div>

          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
            {positions.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                Aucune position ouverte. Passez en mode <strong>AUTO</strong> pour que l'IA commence ses achats et arbitrages.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#172033', color: '#94a3b8', borderBottom: '1px solid #1f2937', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.9rem 1.25rem' }}>Action</th>
                      <th style={{ padding: '0.9rem' }}>Parts</th>
                      <th style={{ padding: '0.9rem' }}>Prix Achat / Actuel</th>
                      <th style={{ padding: '0.9rem' }}>Capital Engagé</th>
                      <th style={{ padding: '0.9rem' }}>Valeur Actuelle</th>
                      <th style={{ padding: '0.9rem' }}>Gain / Perte (P&L)</th>
                      <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Vendre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => {
                      const isProfit = Number(pos.pnl) >= 0;
                      return (
                        <tr key={pos.id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{pos.company_name}</div>
                            <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>{pos.ticker}</div>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{pos.shares}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ color: '#94a3b8' }}>{Number(pos.average_buy_price).toFixed(2)} €</span>
                            <span style={{ margin: '0 0.3rem', color: '#475569' }}>→</span>
                            <strong>{Number(pos.current_price).toFixed(2)} €</strong>
                          </td>
                          <td style={{ padding: '1rem', color: '#94a3b8' }}>{Number(pos.cost_basis).toFixed(2)} €</td>
                          <td style={{ padding: '1rem', fontWeight: 700 }}>{Number(pos.current_value).toFixed(2)} €</td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                              padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.85rem',
                              backgroundColor: isProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: isProfit ? '#10b981' : '#ef4444'
                            }}>
                              {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {isProfit ? '+' : ''}{Number(pos.pnl).toFixed(2)} € ({Number(pos.pnl_percent).toFixed(1)}%)
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleAction('SELL', { positionId: pos.id })}
                              disabled={loading}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.35rem 0.75rem',
                                borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700
                              }}>
                              Vendre
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* 2E BLOC : ANALYSES MULTI-IA & STRATÉGIE DE SCORE */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Analyses Multi-IA & Arbitrage</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {analyses.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{item.ticker}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: '#1e293b', borderRadius: '4px', color: '#94a3b8' }}>
                      {item.ai_name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '6px',
                    backgroundColor: item.signal === 'STRONG_BUY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                    color: item.signal === 'STRONG_BUY' ? '#10b981' : '#38bdf8',
                    border: `1px solid ${item.signal === 'STRONG_BUY' ? '#10b981' : '#38bdf8'}`
                  }}>
                    {item.signal === 'STRONG_BUY' ? 'MAX POINTS (FORT)' : 'ACHAT'}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    <span>Indice de Confiance IA</span>
                    <strong style={{ color: '#f8fafc' }}>{item.confidence}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.confidence}%`, height: '100%', backgroundColor: item.confidence > 90 ? '#10b981' : '#38bdf8' }} />
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {item.reasoning}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3E BLOC : MARCHÉS SUIVIS */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#94a3b8' }}>Cours des Marchés</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {markets.map((m) => (
              <div key={m.ticker} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{m.ticker}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>{m.price} €</div>
                  <div style={{ fontSize: '0.75rem', color: m.change.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 700 }}>
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
