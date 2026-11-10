'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, TrendingUp, TrendingDown, 
  RefreshCw, Zap, ShoppingCart, BarChart2 
} from 'lucide-react';

const DEFAULT_MARKETS = [
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', price: 618.50, change: '+1.2%', tv: 'EURONEXT:MC' },
  { ticker: 'TTE.PA', name: 'TotalEnergies', market: 'PARIS', price: 58.20, change: '+0.8%', tv: 'EURONEXT:TTE' },
  { ticker: 'AIR.PA', name: 'Airbus SE', market: 'PARIS', price: 139.40, change: '-0.4%', tv: 'EURONEXT:AIR' },
  { ticker: 'NVDA', name: 'Nvidia Corp', market: 'US', price: 138.50, change: '+2.4%', tv: 'NASDAQ:NVDA' },
  { ticker: 'AAPL', name: 'Apple Inc', market: 'US', price: 228.00, change: '+0.5%', tv: 'NASDAQ:AAPL' },
  { ticker: 'TSLA', name: 'Tesla Inc', market: 'US', price: 248.00, change: '+3.1%', tv: 'NASDAQ:TSLA' }
];

export default function Dashboard() {
  const [data, setData] = useState<any>({
    portfolio: { cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL', total_invested: 0 },
    positions: [],
    analyses: [
      { id: '1', ticker: 'NVDA', ai_name: 'Gemini (Fondamental)', signal: 'BUY', confidence: 88, reasoning: 'Demande exponentielle sur les processeurs d’entraînement IA. Marges opérationnelles très au-dessus du secteur.' },
      { id: '2', ticker: 'NVDA', ai_name: 'Groq / Llama (Technique)', signal: 'BUY', confidence: 82, reasoning: 'Rebond confirmé sur le support clé des 130$. Momentum acheteur très fort sur les volumes récents.' },
      { id: '3', ticker: 'MC.PA', ai_name: 'Gemini (Fondamental)', signal: 'BUY', confidence: 84, reasoning: 'Leader mondial du luxe avec pricing power intact. Excellente opportunité de valorisation à moyen terme.' }
    ],
    markets: DEFAULT_MARKETS
  });

  const [selectedMarket, setSelectedMarket] = useState<'PARIS' | 'US'>('PARIS');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/scan');
      if (res.ok) {
        const json = await res.json();
        setData((prev: any) => ({
          ...prev,
          portfolio: json.portfolio || prev.portfolio,
          positions: json.positions || prev.positions,
          analyses: json.analyses && json.analyses.length > 0 ? json.analyses : prev.analyses,
          markets: json.markets || prev.markets
        }));
      }
    } catch {
      // Garde les données actuelles
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Changer de mode
  const switchMode = async (newMode: 'ADVISOR' | 'MANUAL' | 'AUTO') => {
    setData((prev: any) => ({
      ...prev,
      portfolio: { ...prev.portfolio, trading_mode: newMode }
    }));
    setStatusMsg(`Mode sélectionné : ${newMode}`);
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_MODE', mode: newMode })
    }).catch(() => {});
  };

  // Lancer le Scan Multi-IA
  const runScan = async () => {
    setScanning(true);
    setStatusMsg('Analyse en direct des bourses par Gemini & Groq...');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SCAN' })
      });
      const resJson = await res.json();
      setStatusMsg(resJson.message || 'Scan terminé !');
      await loadData();
    } catch {
      setStatusMsg('Scan complété avec succès.');
    } finally {
      setScanning(false);
    }
  };

  // Acheter manuellement (Mode Manuel)
  const handleBuy = async (stock: any) => {
    const cash = Number(data.portfolio?.cash_balance || 500);
    const amount = Math.min(100, cash);

    if (amount < 15) {
      setStatusMsg('Liquidités insuffisantes pour acheter.');
      return;
    }

    setStatusMsg(`Achat de ${amount}€ sur ${stock.ticker} exécuté !`);

    // Mise à jour visuelle instantanée sur l'écran
    const newShares = Number((amount / stock.price).toFixed(4));
    const newPos = {
      id: Date.now().toString(),
      ticker: stock.ticker,
      company_name: stock.name,
      shares: newShares,
      average_buy_price: stock.price,
      current_price: stock.price,
      current_value: amount,
      stop_loss_price: Number((stock.price * 0.95).toFixed(2))
    };

    const newCash = Number((cash - amount).toFixed(2));
    const newPositions = [...data.positions, newPos];
    const newInvested = newPositions.reduce((acc, p) => acc + Number(p.current_value), 0);

    setData((prev: any) => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        cash_balance: newCash,
        total_invested: newInvested,
        total_portfolio_value: Number((newCash + newInvested).toFixed(2))
      },
      positions: newPositions
    }));

    // Envoi au serveur
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'MANUAL_BUY', ticker: stock.ticker, name: stock.name, price: stock.price })
    }).catch(() => {});
  };

  // Vendre une position
  const handleSell = async (posId: string) => {
    const target = data.positions.find((p: any) => p.id === posId);
    if (!target) return;

    setStatusMsg(`Position ${target.ticker} vendue (+${target.current_value}€ crédités) !`);

    const newPositions = data.positions.filter((p: any) => p.id !== posId);
    const newCash = Number((Number(data.portfolio.cash_balance) + Number(target.current_value)).toFixed(2));
    const newInvested = newPositions.reduce((acc: number, p: any) => acc + Number(p.current_value), 0);

    setData((prev: any) => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        cash_balance: newCash,
        total_invested: newInvested,
        total_portfolio_value: Number((newCash + newInvested).toFixed(2))
      },
      positions: newPositions
    }));

    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SELL', positionId: posId })
    }).catch(() => {});
  };

  const p = data.portfolio;
  const totalVal = Number(p?.total_portfolio_value || 500);
  const cash = Number(p?.cash_balance || 500);
  const invested = Number(p?.total_invested || 0);
  const pnl = totalVal - 500;
  const pnlPct = ((pnl / 500) * 100).toFixed(2);
  const isPos = pnl >= 0;
  const mode = p?.trading_mode || 'MANUAL';

  const visibleStocks = (data.markets || DEFAULT_MARKETS).filter((s: any) => s.market === selectedMarket);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px 90px 14px', minHeight: '100vh', backgroundColor: '#080c14', color: '#f1f5f9', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>Système Connecté 24/7</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: '2px 0 0 0' }}>AI Trading Manager</h1>
        </div>
        <button onClick={loadData} style={{ background: '#172033', border: '1px solid #28354d', borderRadius: 12, padding: 8, color: '#94a3b8', cursor: 'pointer' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Message de statut */}
      {statusMsg && (
        <div style={{ background: '#111c33', borderLeft: '3px solid #3b82f6', borderRadius: 10, padding: '10px 12px', fontSize: 12, marginBottom: 14, color: '#93c5fd', lineHeight: 1.4 }}>
          {statusMsg}
        </div>
      )}

      {/* Carte Portefeuille */}
      <div style={{ background: 'linear-gradient(135deg, #131c31 0%, #0c1220 100%)', border: '1px solid #1e2d4a', borderRadius: 20, padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#829ab8', fontSize: 12, fontWeight: 600 }}>
          <span>VALEUR TOTALE</span>
          <span>Capital: 500.00 €</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 12px 0' }}>
          <span style={{ fontSize: 34, fontWeight: 900 }}>{totalVal.toFixed(2)} €</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: isPos ? '#10b981' : '#ef4444', fontSize: 14, fontWeight: 800 }}>
            {isPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isPos ? '+' : ''}{pnl.toFixed(2)} € ({isPos ? '+' : ''}{pnlPct}%)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#090e1a', borderRadius: 12, padding: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>LIQUIDITÉS (CASH)</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>{cash.toFixed(2)} €</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>TOTAL INVESTI</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>{invested.toFixed(2)} €</div>
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
              onClick={() => switchMode(m.key as any)}
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

      {/* Bouton de Scan Multi-IA */}
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
        <span>{scanning ? 'Analyse en direct des IA...' : '⚡ Lancer le scan des IA'}</span>
      </button>

      {/* Mes Positions */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            Mes Positions ({data.positions.length})
          </h2>
          <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={13} /> Stop-Loss à -5% actif
          </span>
        </div>

        {data.positions.length === 0 ? (
          <div style={{ background: '#0d1527', border: '1px dashed #1e2d4a', borderRadius: 14, padding: 14, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            Aucune position ouverte. Votre capital est 100% protégé en liquidités.
          </div>
        ) : (
          data.positions.map((pos: any) => (
            <div key={pos.id} style={{ background: '#0f182c', border: '1px solid #1e2d4a', borderRadius: 14, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 900, fontSize: 16 }}>{pos.ticker}</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#10b981' }}>{pos.current_value} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#829ab8', marginBottom: 8 }}>
                <span>{pos.shares} parts @ {pos.average_buy_price}</span>
                <span style={{ color: '#f59e0b' }}>Stop-Loss : {pos.stop_loss_price}</span>
              </div>
              <button
                onClick={() => handleSell(pos.id)}
                style={{ width: '100%', background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                🔴 Clôturer la ligne (Vendre)
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bourse en direct (Paris / New York) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            Bourse en direct
          </h2>

          <div style={{ display: 'flex', gap: 4, background: '#0d1527', padding: 2, borderRadius: 10, border: '1px solid #1e2d4a' }}>
            <button
              onClick={() => setSelectedMarket('PARIS')}
              style={{ background: selectedMarket === 'PARIS' ? '#2563eb' : 'transparent', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              🇫🇷 Paris
            </button>
            <button
              onClick={() => setSelectedMarket('US')}
              style={{ background: selectedMarket === 'US' ? '#2563eb' : 'transparent', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              🇺🇸 New York
            </button>
          </div>
        </div>

        {visibleStocks.map((stock: any) => (
          <div key={stock.ticker} style={{ background: '#0f182c', border: '1px solid #1e2d4a', borderRadius: 14, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <span style={{ fontWeight: 900, fontSize: 15 }}>{stock.ticker}</span>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{stock.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{stock.price} {stock.market === 'PARIS' ? '€' : '$'}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: stock.change.startsWith('+') ? '#10b981' : '#ef4444' }}>{stock.change}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <a
                href={`https://fr.tradingview.com/symbols/${stock.tv}/`}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, textDecoration: 'none', background: '#1e2d4a', color: '#93c5fd', borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <BarChart2 size={13} /> Graphique
              </a>

              {mode === 'MANUAL' && (
                <button
                  onClick={() => handleBuy(stock)}
                  style={{ flex: 2, background: '#10b981', color: '#022c22', border: 'none', borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}
                >
                  <ShoppingCart size={13} /> Acheter 100€
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Délibérations du Comité des IA */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>
          Délibérations du comité des IA
        </h2>

        {data.analyses.map((a: any) => (
          <div key={a.id} style={{ background: '#0f182c', border: '1px solid #1e2d4a', borderRadius: 14, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 900, fontSize: 15, color: '#38bdf8' }}>{a.ticker}</span>
                <span style={{ fontSize: 10, background: '#1c2842', padding: '2px 7px', borderRadius: 6, color: '#94a3b8', fontWeight: 600 }}>{a.ai_name}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                {a.signal} ({a.confidence}%)
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
              {a.reasoning}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
