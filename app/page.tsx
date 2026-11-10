'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, TrendingUp, TrendingDown, 
  RefreshCw, Zap, ShoppingCart, XCircle, CheckCircle2 
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>({ portfolio: null, positions: [], analyses: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Charger toutes les données via le serveur sécurisé
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/scan');
      const json = await res.json();
      setData(json);
    } catch {
      setStatusMsg('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Changer de mode
  const switchMode = async (mode: string) => {
    setStatusMsg(`Mode changé en : ${mode}`);
    // Mettre à jour localement immédiatement
    setData((prev: any) => ({
      ...prev,
      portfolio: { ...prev.portfolio, trading_mode: mode }
    }));
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_MODE', mode })
    }).catch(() => {});
    loadData();
  };

  // Lancer le Scan Multi-IA
  const runScan = async () => {
    setScanning(true);
    setStatusMsg('Les IA Gemini et Groq analysent les marchés...');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SCAN' })
      });
      const result = await res.json();
      if (result.logs) setStatusMsg(result.logs.join(' | '));
      await loadData();
    } catch {
      setStatusMsg('Erreur pendant le scan.');
    } finally {
      setScanning(false);
    }
  };

  // Acheter manuellement une opportunité suggérée
  const buyStock = async (ticker: string, price: number) => {
    setStatusMsg(`Achat de 100€ sur ${ticker} en cours...`);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MANUAL_BUY', ticker, name: ticker, price, amount: 100 })
      });
      const result = await res.json();
      setStatusMsg(result.message || 'Ordre exécuté !');
      await loadData();
    } catch {
      setStatusMsg('Erreur lors de l’achat.');
    }
  };

  // Vendre une position
  const sellStock = async (positionId: string, ticker: string) => {
    setStatusMsg(`Vente de la ligne ${ticker}...`);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SELL_POSITION', positionId })
      });
      const result = await res.json();
      setStatusMsg(result.message || 'Position vendue avec succès !');
      await loadData();
    } catch {
      setStatusMsg('Erreur lors de la vente.');
    }
  };

  const p = data.portfolio;
  const totalVal = p?.total_portfolio_value || 500;
  const cash = p?.cash_balance || 500;
  const invested = p?.total_invested || 0;
  const pnl = totalVal - 500;
  const pnlPct = ((pnl / 500) * 100).toFixed(2);
  const isPos = pnl >= 0;
  const mode = p?.trading_mode || 'MANUAL';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px 90px 14px', minHeight: '100vh', backgroundColor: '#080c14', color: '#f1f5f9', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>Système Actif 24/7</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '2px 0 0 0' }}>AI Trading Manager</h1>
        </div>
        <button onClick={loadData} style={{ background: '#172033', border: '1px solid #28354d', borderRadius: 12, padding: 8, color: '#94a3b8', cursor: 'pointer' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Barre de messages / Logs */}
      {statusMsg && (
        <div style={{ background: '#111c33', borderLeft: '3px solid #3b82f6', borderRadius: 10, padding: '10px 12px', fontSize: 12, marginBottom: 14, color: '#93c5fd', lineHeight: 1.4 }}>
          {statusMsg}
        </div>
      )}

      {/* Carte Portefeuille */}
      <div style={{ background: 'linear-gradient(135deg, #131c31 0%, #0c1220 100%)', border: '1px solid #1e2d4a', borderRadius: 20, padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#829ab8', fontSize: 12, fontWeight: 600 }}>
          <span>VALEUR DU PORTEFEUILLE</span>
          <span>Capital: 500.00 €</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 12px 0' }}>
          <span style={{ fontSize: 34, fontWeight: 900 }}>{Number(totalVal).toFixed(2)} €</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: isPos ? '#10b981' : '#ef4444', fontSize: 14, fontWeight: 800 }}>
            {isPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isPos ? '+' : ''}{pnl.toFixed(2)} € ({isPos ? '+' : ''}{pnlPct}%)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#090e1a', borderRadius: 12, padding: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>DISPONIBLE (CASH)</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>{Number(cash).toFixed(2)} €</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>TOTAL INVESTI</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>{Number(invested).toFixed(2)} €</div>
          </div>
        </div>
      </div>

      {/* Sélecteur des 3 Modes */}
      <div style={{ background: '#0d1527', borderRadius: 16, padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 14, border: '1px solid #1e2d4a' }}>
        {[
          { key: 'ADVISOR', label: 'Conseiller' },
          { key: 'MANUAL', label: 'Manuel' },
          { key: 'AUTO', label: 'Automatique' }
        ].map((m) => {
          const isActive = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => switchMode(m.key)}
              style={{
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                color: isActive ? '#fff' : '#64748b',
                border: 'none',
                borderRadius: 12,
                padding: '9px 0',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Bouton de Scan Instantané */}
      <button
        onClick={runScan}
        disabled={scanning}
        style={{
          width: '100%',
          backgroundColor: '#10b981',
          color: '#022c22',
          border: 'none',
          borderRadius: 14,
          padding: 13,
          fontSize: 14,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 18,
          cursor: 'pointer'
        }}
      >
        <Zap size={18} fill="#022c22" />
        <span>{scanning ? 'Analyse Multi-IA en cours...' : '⚡ Lancer le scan des opportunités'}</span>
      </button>

      {/* Positions Ouvertes */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Positions détenues ({data.positions.length})
          </h2>
          <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={13} /> Stop-Loss à -5% actif
          </span>
        </div>

        {data.positions.length === 0 ? (
          <div style={{ background: '#0d1527', border: '1px dashed #1e2d4a', borderRadius: 14, padding: 14, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            Aucune position ouverte. Votre capital est 100% en liquidités.
          </div>
        ) : (
          data.positions.map((pos: any) => (
            <div key={pos.id} style={{ background: '#0f182c', border: '1px solid #1e2d4a', borderRadius: 14, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{pos.ticker}</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: pos.unrealized_pnl >= 0 ? '#10b981' : '#ef4444' }}>
                  {pos.unrealized_pnl >= 0 ? '+' : ''}{pos.current_value} €
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#829ab8', marginBottom: 8 }}>
                <span>{pos.shares} parts @ {pos.average_buy_price}$</span>
                <span style={{ color: '#f59e0b' }}>Stop-Loss : {pos.stop_loss_price}$</span>
              </div>
              <button
                onClick={() => sellStock(pos.id, pos.ticker)}
                style={{ width: '100%', background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Clôturer la position (Vendre)
              </button>
            </div>
          ))
        )}
      </div>

      {/* Délibérations du Comité des IA */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          DÉLIBÉRATIONS DU COMITÉ DES IA
        </h2>

        {data.analyses.length === 0 ? (
          <div style={{ background: '#0d1527', border: '1px solid #1e2d4a', borderRadius: 14, padding: 16, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            Touchez « Lancer le scan » pour afficher les avis en direct de Gemini et Groq.
          </div>
        ) : (
          data.analyses.map((a: any) => {
            const isBuy = a.signal === 'BUY';
            return (
              <div key={a.id} style={{ background: '#0f182c', border: '1px solid #1e2d4a', borderRadius: 14, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 900, fontSize: 15, color: '#38bdf8' }}>{a.ticker}</span>
                    <span style={{ fontSize: 10, background: '#1c2842', padding: '2px 7px', borderRadius: 6, color: '#94a3b8', fontWeight: 600 }}>{a.ai_name}</span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: isBuy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: isBuy ? '#10b981' : '#ef4444'
                  }}>
                    {a.signal} ({a.confidence}%)
                  </span>
                </div>

                <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  {a.reasoning}
                </p>

                {/* Bouton d'Achat Manuel pour profiter de l'opportunité */}
                {mode === 'MANUAL' && isBuy && (
                  <button
                    onClick={() => buyStock(a.ticker, a.ticker === 'NVDA' ? 138.5 : 228.0)}
                    style={{
                      width: '100%',
                      background: '#1d4ed8',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 9,
                      padding: '8px 0',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <ShoppingCart size={14} />
                    <span>Acheter 100€ de {a.ticker} (Stop-Loss auto à -5%)</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
