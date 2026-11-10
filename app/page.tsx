'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, TrendingUp, TrendingDown, 
  RefreshCw, Zap 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: p } = await supabase.from('portfolio').select('*').single();
      const { data: pos } = await supabase.from('positions').select('*');
      const { data: ana } = await supabase.from('ai_analyses').select('*').order('created_at', { ascending: false }).limit(6);

      if (p) setPortfolio(p);
      if (pos) setPositions(pos);
      if (ana) setAnalyses(ana);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setMode = async (mode: 'ADVISOR' | 'MANUAL' | 'AUTO') => {
    if (!portfolio) return;
    const { error } = await supabase.from('portfolio').update({ trading_mode: mode }).eq('id', portfolio.id);
    if (!error) {
      setPortfolio({ ...portfolio, trading_mode: mode });
    }
  };

  const triggerScan = async () => {
    setScanning(true);
    setScanMessage('Analyse des marchés par Gemini & Groq...');
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      if (data.logs && data.logs.length > 0) {
        setScanMessage(data.logs.join(' | '));
      } else {
        setScanMessage('Scan terminé : Marchés analysés, seuils de risque respectés.');
      }
      await loadData();
    } catch {
      setScanMessage('Erreur lors du scan.');
    } finally {
      setScanning(false);
      setTimeout(() => setScanMessage(null), 8000);
    }
  };

  const totalVal = portfolio?.total_portfolio_value || 500;
  const initialCap = portfolio?.initial_capital || 500;
  const pnlTotal = totalVal - initialCap;
  const pnlPct = ((pnlTotal / initialCap) * 100).toFixed(2);
  const isPositive = pnlTotal >= 0;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px 90px 14px', minHeight: '100vh', backgroundColor: '#090d16', color: '#f1f5f9' }}>
      
      {/* En-tête Mobile */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingTop: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Système Actif 24/7</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '2px 0 0 0', letterSpacing: -0.5 }}>AI Trading Manager</h1>
        </div>

        <button 
          onClick={loadData}
          style={{ background: '#171e2e', border: '1px solid #2d3748', borderRadius: 12, padding: 8, color: '#94a3b8', display: 'flex', cursor: 'pointer' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Message d'action de l'IA */}
      {scanMessage && (
        <div style={{ background: '#1e293b', borderLeft: '3px solid #3b82f6', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 16 }}>
          {scanMessage}
        </div>
      )}

      {/* Carte Principale du Portefeuille */}
      <div style={{ background: 'linear-gradient(135deg, #131b2e 0%, #0d1322 100%)', border: '1px solid #1e293b', borderRadius: 20, padding: 18, marginBottom: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>
          <span>VALEUR DU PORTEFEUILLE</span>
          <span>Départ: {Number(initialCap).toFixed(2)} €</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0 12px 0' }}>
          <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1 }}>{Number(totalVal).toFixed(2)} €</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: isPositive ? '#10b981' : '#ef4444', fontSize: 14, fontWeight: 700 }}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isPositive ? '+' : ''}{pnlTotal.toFixed(2)} € ({isPositive ? '+' : ''}{pnlPct}%)</span>
          </div>
        </div>

        {/* Détails Liquidités & Investi */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#0a0f1d', borderRadius: 12, padding: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>DISPONIBLE (CASH)</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>{Number(portfolio?.cash_balance || 500).toFixed(2)} €</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>TOTAL INVESTI</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#38bdf8' }}>{Number(portfolio?.total_invested || 0).toFixed(2)} €</div>
          </div>
        </div>
      </div>

      {/* Sélecteur des 3 Modes */}
      <div style={{ background: '#0f172a', borderRadius: 16, padding: 5, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 16, border: '1px solid #1e293b' }}>
        {(['ADVISOR', 'MANUAL', 'AUTO'] as const).map((m) => {
          const isActive = portfolio?.trading_mode === m;
          const labels = { ADVISOR: 'Conseiller', MANUAL: 'Manuel', AUTO: 'Automatique' };
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                color: isActive ? '#fff' : '#64748b',
                border: 'none',
                borderRadius: 12,
                padding: '9px 0',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* Bouton de Scan Instantané */}
      <button
        onClick={triggerScan}
        disabled={scanning}
        style={{
          width: '100%',
          backgroundColor: '#10b981',
          color: '#022c22',
          border: 'none',
          borderRadius: 14,
          padding: 13,
          fontSize: 14,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 20,
          cursor: 'pointer'
        }}
      >
        <Zap size={18} fill="#022c22" />
        <span>{scanning ? 'Analyse Multi-IA en cours...' : '⚡ Scanner le marché avec les IA'}</span>
      </button>

      {/* Section Positions Détenues */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', letterSpacing: 0.5 }}>POSITIONS ACTUELLES ({positions.length})</h2>
          <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={13} /> Stop-Loss à -5% actif
          </span>
        </div>

        {positions.length === 0 ? (
          <div style={{ background: '#0e1526', border: '1px dashed #1e293b', borderRadius: 14, padding: 18, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Aucune position ouverte. Capital 100% protégé en liquidités.
          </div>
        ) : (
          positions.map((p) => (
            <div key={p.id} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{p.ticker}</span>
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{p.shares} parts</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: p.unrealized_pnl >= 0 ? '#10b981' : '#ef4444' }}>
                  {p.unrealized_pnl >= 0 ? '+' : ''}{p.unrealized_pnl} € ({p.unrealized_pnl_pct}%)
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                <span>Achat: {p.average_buy_price}$ | Actuel: {p.current_price}$</span>
                <span style={{ color: '#f59e0b' }}>Stop-Loss: {p.stop_loss_price}$</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Section Dernières Décisions des IA */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', letterSpacing: 0.5, marginBottom: 10 }}>
          DÉLIBÉRATIONS DU COMITÉ DES IA
        </h2>

        {analyses.length === 0 ? (
          <div style={{ background: '#0e1526', border: '1px solid #1e293b', borderRadius: 14, padding: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Touchez « Scanner le marché » pour obtenir les premières analyses de Gemini et Groq.
          </div>
        ) : (
          analyses.map((a) => (
            <div key={a.id} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#38bdf8' }}>{a.ticker}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, background: '#1e293b', padding: '3px 7px', borderRadius: 8, color: '#94a3b8' }}>{a.ai_name}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: a.signal === 'BUY' ? '#10b981' : a.signal === 'SELL' ? '#ef4444' : '#f59e0b' }}>
                    {a.signal} ({a.confidence}%)
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                {a.reasoning}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
