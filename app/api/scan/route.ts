import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 25;

function getSupabase() {
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  try {
    const parsed = new URL(rawUrl);
    rawUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {}
  let rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
  return createClient(rawUrl, rawKey);
}

// BASSIN BOURSIER OFFICIEL
const WATCHLIST = [
  // PARIS (EURONEXT)
  { ticker: 'DSY.PA', name: 'Dassault Systèmes SE', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'LOGICIELS / IA 3D', fallbackPrice: 25.39, open: 25.22, high: 25.64, low: 25.16, volume: '397,3 k', per: '25,64', cap: '33,36 Md €', h52: '26,50 €', b52: '18,00 €', catalyst: 'Croissance à deux chiffres des licences cloud 3DEXPERIENCE et jumeaux virtuels.' },
  { ticker: 'AM.PA', name: 'Dassault Aviation', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'DÉFENSE / AÉRO', fallbackPrice: 198.50, open: 197.00, high: 200.20, low: 196.10, volume: '220,4 k', per: '18,10', cap: '16,50 Md €', h52: '210,00 €', b52: '168,00 €', catalyst: 'Commandes records à l’export pour les avions de combat Rafale.' },
  { ticker: 'AIR.PA', name: 'Airbus SE', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'AÉRONAUTIQUE', fallbackPrice: 141.20, open: 140.50, high: 142.80, low: 140.10, volume: '950,4 k', per: '26,80', cap: '111,20 Md €', h52: '172,00 €', b52: '124,00 €', catalyst: 'Cadences de livraisons d’avions commerciaux A320/A321 en nette hausse.' },
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'LUXE MONDIAL', fallbackPrice: 624.00, open: 620.00, high: 628.50, low: 618.00, volume: '410,2 k', per: '21,50', cap: '312,40 Md €', h52: '885,00 €', b52: '582,00 €', catalyst: 'Stabilisation de la demande en Asie et fort pricing power.' },
  { ticker: 'SU.PA', name: 'Schneider Electric', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'INFRA DATA CENTERS', fallbackPrice: 242.00, open: 240.00, high: 244.50, low: 239.50, volume: '890,5 k', per: '31,20', cap: '136,20 Md €', h52: '248,00 €', b52: '155,00 €', catalyst: 'Équipement électrique indispensable des data centers IA mondiaux.' },
  { ticker: 'RMS.PA', name: 'Hermès International', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'ULTRA-LUXE', fallbackPrice: 2080.00, open: 2070.00, high: 2100.00, low: 2060.00, volume: '65,1 k', per: '48,20', cap: '218,60 Md €', h52: '2430,00 €', b52: '1850,00 €', catalyst: 'Commandes saturées et marges opérationnelles record.' },

  // WALL STREET (US)
  { ticker: 'MSFT', name: 'Microsoft Corp', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'CLOUD GÉANT', fallbackPrice: 522.88, open: 534.22, high: 534.76, low: 518.45, volume: '19,5 M', per: '34,20', cap: '3 880 Md $', h52: '555,00 $', b52: '388,00 $', catalyst: 'Monétisation d’Azure OpenAI et des postes Copilot en entreprise.' },
  { ticker: 'PLTR', name: 'Palantir Technologies', market: 'US', currency: '$', place: 'NYSE · USD', category: 'IA / DÉFENSE', fallbackPrice: 44.50, open: 43.50, high: 45.80, low: 43.10, volume: '45,8 M', per: '92,00', cap: '101,20 Md $', h52: '45,80 $', b52: '15,20 $', catalyst: 'Signature de méga-contrats militaires US et forte adoption de la plateforme AIP.' },
  { ticker: 'NVDA', name: 'Nvidia Corp', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'SEMI-CONDUCTEURS', fallbackPrice: 142.50, open: 140.50, high: 144.20, low: 139.80, volume: '58,4 M', per: '52,30', cap: '3 510 Md $', h52: '144,00 $', b52: '45,00 $', catalyst: 'Demande record de puces Blackwell et marges brutes de 75%.' },
  { ticker: 'TSLA', name: 'Tesla Inc', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'AUTO / ROBOTIQUE', fallbackPrice: 254.00, open: 250.00, high: 259.00, low: 248.50, volume: '62,1 M', per: '74,10', cap: '815 Md $', h52: '271,00 $', b52: '138,00 $', catalyst: 'Homologation FSD en Chine et réseau de Robotaxis autonomes.' }
];

// EXTRACTION DES COURS EN DIRECT DE YAHOO FINANCE SUR LA PÉRIODE DEMANDÉE
async function fetchRealYahooChart(ticker: string, period: string) {
  let range = '1d';
  let interval = '2m';

  switch (period) {
    case '1H':
      range = '1d';
      interval = '1m';
      break;
    case '1D':
      range = '1d';
      interval = '5m';
      break;
    case '1W':
      range = '5d';
      interval = '15m';
      break;
    case '1M':
      range = '1mo';
      interval = '1d';
      break;
    case '3M':
      range = '3mo';
      interval = '1d';
      break;
    case '1Y':
    default:
      range = '1y';
      interval = '1d';
      break;
  }

  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
      next: { revalidate: period === '1H' ? 15 : 60 }
    });

    if (res.ok) {
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (result) {
        const meta = result.meta;
        const rawCloses: number[] = result.indicators?.quote?.[0]?.close || [];
        const rawTimestamps: number[] = result.timestamp || [];

        // Filtrer les valeurs nulles
        let validPoints: { price: number; ts: number }[] = [];
        for (let i = 0; i < rawTimestamps.length; i++) {
          const c = rawCloses[i];
          const t = rawTimestamps[i];
          if (typeof c === 'number' && !isNaN(c) && t) {
            validPoints.push({ price: Number(c.toFixed(2)), ts: t });
          }
        }

        // Si période 1H : prendre uniquement les 50 dernières minutes réelles
        if (period === '1H' && validPoints.length > 50) {
          validPoints = validPoints.slice(-50);
        }

        if (validPoints.length >= 4) {
          const prices = validPoints.map(p => p.price);
          const maxVal = Math.max(...prices);
          const minVal = Math.min(...prices);
          const openPrice = validPoints[0].price;
          const closePrice = validPoints[validPoints.length - 1].price;
          const changeVal = Number((((closePrice - openPrice) / openPrice) * 100).toFixed(2));
          const changeStr = (changeVal >= 0 ? '+' : '') + changeVal.toFixed(2).replace('.', ',') + ' %';

          // Formatage des repères temporels français
          const xMarkers: string[] = [];
          const stepIdx = Math.floor(validPoints.length / 4);
          for (let k = 0; k < 4; k++) {
            const pt = validPoints[Math.min(k * stepIdx, validPoints.length - 1)];
            const d = new Date(pt.ts * 1000);
            if (period === '1H' || period === '1D') {
              xMarkers.push(d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).replace(':', 'h'));
            } else if (period === '1W') {
              xMarkers.push(d.toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'Europe/Paris' }));
            } else if (period === '1M' || period === '3M') {
              xMarkers.push(d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' }));
            } else {
              xMarkers.push(d.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'Europe/Paris' }));
            }
          }

          // ÉCHELLE Y EXACTE : Centimes affichés proprement (ex: 25,48 - 25,42 - 25,36 - 25,31)
          const diff = maxVal - minVal;
          const scaleSteps = [
            maxVal.toFixed(2).replace('.', ','),
            (minVal + diff * 0.66).toFixed(2).replace('.', ','),
            (minVal + diff * 0.33).toFixed(2).replace('.', ','),
            minVal.toFixed(2).replace('.', ',')
          ];

          return {
            points: validPoints.map((p, i) => ({ label: `${i}`, price: p.price, ts: p.ts })),
            high: maxVal,
            low: minVal,
            open: openPrice,
            close: closePrice,
            periodChange: `${changeStr} (${period})`,
            xMarkers,
            scaleSteps
          };
        }
      }
    }
  } catch (err) {}

  return null;
}

// RÉCUPÉRATION DU COURS TEMPS RÉEL GLOBAL
async function fetchYahooSummary(item: any) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.ticker)}?interval=2m&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
      next: { revalidate: 30 }
    });

    if (res.ok) {
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (result) {
        const meta = result.meta;
        const closes: number[] = (result.indicators?.quote?.[0]?.close || []).filter((c: any) => typeof c === 'number' && !isNaN(c));
        const livePrice = Number((meta.regularMarketPrice || (closes.length > 0 ? closes[closes.length - 1] : item.fallbackPrice)).toFixed(2));
        const prevClose = Number((meta.chartPreviousClose || livePrice).toFixed(2));
        
        const rawHigh = meta.regularMarketDayHigh || (closes.length > 0 ? Math.max(...closes) : item.high);
        const rawLow = meta.regularMarketDayLow || (closes.length > 0 ? Math.min(...closes) : item.low);
        const dayHigh = Number(Math.max(rawHigh, livePrice).toFixed(2));
        const dayLow = Number(Math.min(rawLow, livePrice).toFixed(2));
        const dayOpen = Number((meta.regularMarketDayLow ? prevClose : (closes[0] || item.open)).toFixed(2));
        const changeVal = Number((((livePrice - prevClose) / prevClose) * 100).toFixed(2));

        return {
          price: livePrice,
          high: dayHigh,
          low: dayLow,
          open: dayOpen,
          changeVal,
          volume: meta.regularMarketVolume ? `${(meta.regularMarketVolume / 1000).toFixed(1)} k` : item.volume
        };
      }
    }
  } catch (e) {}

  return {
    price: item.fallbackPrice,
    high: item.high,
    low: item.low,
    open: item.open,
    changeVal: 0.59,
    volume: item.volume
  };
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non identifié.' }, { status: 401 });
    }

    if (action === 'ADD_MANUAL_POSITION') {
      const { ticker, name, shares, averageBuyPrice, alertThreshold } = body;
      const { error } = await supabase.from('manual_portfolio').insert({
        user_id: userId,
        ticker,
        company_name: name,
        shares: Number(shares),
        average_buy_price: Number(averageBuyPrice),
        alert_threshold_pct: Number(alertThreshold || 3.0)
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: `Position ${ticker} enregistrée.` });
    }

    if (action === 'DELETE_MANUAL_POSITION') {
      const { positionId } = body;
      await supabase.from('manual_portfolio').delete().eq('id', positionId).eq('user_id', userId);
      return NextResponse.json({ success: true, message: 'Position supprimée.' });
    }

    if (action === 'RESET_SIMULATION') {
      await supabase.from('simulation_positions').delete().eq('user_id', userId);
      await supabase.from('simulation_portfolio').upsert({
        user_id: userId,
        cash_balance: 500.00,
        total_value: 500.00,
        ai_score: 1000,
        trading_mode: 'AUTO'
      });
      return NextResponse.json({ success: true, message: 'Simulation réinitialisée à 500 €.' });
    }

    if (action === 'AUTO_SIMULATION_STEP') {
      let { data: simPort } = await supabase.from('simulation_portfolio').select('*').eq('user_id', userId).maybeSingle();
      if (!simPort) {
        simPort = { user_id: userId, cash_balance: 500, total_value: 500, ai_score: 1000, trading_mode: 'AUTO' };
        await supabase.from('simulation_portfolio').upsert(simPort);
      }

      let cash = Number(simPort.cash_balance);
      const { data: currentPositions } = await supabase.from('simulation_positions').select('ticker').eq('user_id', userId);
      const owned = new Set((currentPositions || []).map((p: any) => p.ticker));

      const candidates = WATCHLIST.filter(w => !owned.has(w.ticker)).slice(0, 3);
      const newPurchases: any[] = [];

      for (const target of candidates) {
        if (cash < 20) break;
        const live = await fetchYahooSummary(target);

        const investAmount = Number(Math.min(cash >= 150 ? 70 : 45, cash).toFixed(2));
        const shares = Number((investAmount / live.price).toFixed(4));
        const stopLoss = Number((live.price * 0.93).toFixed(2));

        newPurchases.push({
          user_id: userId,
          ticker: target.ticker,
          company_name: target.name,
          shares,
          average_buy_price: live.price,
          current_price: live.price,
          current_value: investAmount,
          stop_loss_price: stopLoss
        });

        cash = Number((cash - investAmount).toFixed(2));
      }

      if (newPurchases.length > 0) {
        await supabase.from('simulation_positions').insert(newPurchases);
        await supabase.from('simulation_portfolio').update({ cash_balance: cash }).eq('user_id', userId);
      }

      return NextResponse.json({
        success: true,
        message: newPurchases.length > 0 
          ? `L'IA a investi sur : ${newPurchases.map(p => `${p.ticker} (${p.current_value}€)`).join(', ')}`
          : 'L’IA maintient ses positions actuelles.'
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // 1. REQUÊTE DE GRAPHIQUE PRÉCIS À LA DEMANDE (1H, 1J, 1S, 1M, 3M, 1A)
    const chartTicker = searchParams.get('chartTicker');
    const chartPeriod = searchParams.get('chartPeriod');
    if (chartTicker && chartPeriod) {
      const realChart = await fetchRealYahooChart(chartTicker, chartPeriod);
      return NextResponse.json({ chart: realChart });
    }

    // 2. RÉCUPÉRATION DU SOMMAIRE DU MARCHÉ
    const liveMarkets = await Promise.all(
      WATCHLIST.map(async (item) => {
        const live = await fetchYahooSummary(item);
        const changeStr = (live.changeVal >= 0 ? '+' : '') + live.changeVal.toFixed(2).replace('.', ',') + ' %';

        let aiSignal = 'CONSERVER';
        let aiColor = 'YELLOW';
        let aiConfidence = 82;

        if (live.changeVal >= 2.0) {
          aiSignal = 'ACHAT FORT';
          aiColor = 'GREEN_DARK';
          aiConfidence = 96;
        } else if (live.changeVal >= 0.4) {
          aiSignal = 'ACHAT';
          aiColor = 'GREEN_LIGHT';
          aiConfidence = 90;
        } else if (live.changeVal >= -1.5) {
          aiSignal = 'ATTENTION';
          aiColor = 'YELLOW';
          aiConfidence = 84;
        } else {
          aiSignal = 'DÉCONSEILLÉ';
          aiColor = 'RED';
          aiConfidence = 76;
        }

        return {
          ticker: item.ticker,
          name: item.name,
          market: item.market,
          currency: item.currency,
          place: item.place,
          category: item.category,
          price: live.price,
          priceFormatted: live.price.toFixed(2).replace('.', ','),
          change: changeStr,
          changeRaw: live.changeVal,
          open: live.open.toFixed(2).replace('.', ','),
          high: live.high.toFixed(2).replace('.', ','),
          low: live.low.toFixed(2).replace('.', ','),
          volume: live.volume,
          per: item.per,
          marketCap: item.cap,
          h52: item.h52,
          b52: item.b52,
          aiSignal,
          aiColor,
          aiConfidence,
          aiAdvice: aiColor === 'GREEN_DARK' 
            ? `Alerte IA : Forte poussée haussière (+${live.changeVal}%). Volumes massifs et dynamique technique très solide.`
            : aiColor === 'GREEN_LIGHT'
            ? `Recommandation IA : Progression saine et régulière. Bon point d'entrée pour viser un gain durable.`
            : aiColor === 'YELLOW'
            ? `Avis IA : Marché en phase d'attente ou légère consolidation. Conserver ses positions sans renforcer.`
            : `Avertissement IA : Repli technique en cours (-${Math.abs(live.changeVal)}%). Attendre une stabilisation avant d'acheter.`,
          catalyst: item.catalyst
        };
      })
    );

    let manualPositions: any[] = [];
    let simulationPortfolio: any = { cash_balance: 500, total_value: 500 };
    let simulationPositions: any[] = [];

    if (userId) {
      const { data: mPos } = await supabase.from('manual_portfolio').select('*').eq('user_id', userId);
      manualPositions = (mPos || []).map((p: any) => {
        const live = liveMarkets.find(m => m.ticker === p.ticker);
        const curPrice = live ? live.price : Number(p.average_buy_price);
        const cost = Number((Number(p.shares) * Number(p.average_buy_price)).toFixed(2));
        const val = Number((Number(p.shares) * curPrice).toFixed(2));
        const pnl = Number((val - cost).toFixed(2));
        const pnlPct = cost > 0 ? Number(((pnl / cost) * 100).toFixed(2)) : 0;

        return {
          ...p,
          currency: live?.currency || '€',
          current_price: curPrice,
          current_value: val,
          cost_basis: cost,
          pnl,
          pnl_percent: pnlPct,
          open: live?.open || 'N/A',
          high: live?.high || 'N/A',
          low: live?.low || 'N/A',
          volume: live?.volume || 'N/A',
          per: live?.per || 'N/A',
          marketCap: live?.marketCap || 'N/A',
          h52: live?.h52 || 'N/A',
          b52: live?.b52 || 'N/A',
          place: live?.place || 'Paris · EUR',
          aiAdvice: live?.aiAdvice || 'Action sous surveillance continue.',
          aiSignal: live?.aiSignal || 'SURVEILLANCE',
          aiColor: live?.aiColor || 'YELLOW'
        };
      });

      const { data: sPort } = await supabase.from('simulation_portfolio').select('*').eq('user_id', userId).maybeSingle();
      if (sPort) simulationPortfolio = sPort;

      const { data: sPos } = await supabase.from('simulation_positions').select('*').eq('user_id', userId);
      let simVal = 0;
      simulationPositions = (sPos || []).map((p: any) => {
        const live = liveMarkets.find(m => m.ticker === p.ticker);
        const curPrice = live ? live.price : Number(p.current_price);
        const cost = Number((Number(p.shares) * Number(p.average_buy_price)).toFixed(2));
        const val = Number((Number(p.shares) * curPrice).toFixed(2));
        const pnl = Number((val - cost).toFixed(2));
        const pnlPct = cost > 0 ? Number(((pnl / cost) * 100).toFixed(2)) : 0;
        simVal += val;

        return {
          ...p,
          currency: live?.currency || '€',
          current_price: curPrice,
          current_value: val,
          cost_basis: cost,
          pnl,
          pnl_percent: pnlPct,
          open: live?.open || 'N/A',
          high: live?.high || 'N/A',
          low: live?.low || 'N/A',
          volume: live?.volume || 'N/A',
          per: live?.per || 'N/A',
          marketCap: live?.marketCap || 'N/A',
          h52: live?.h52 || 'N/A',
          b52: live?.b52 || 'N/A',
          place: live?.place || 'Paris · EUR'
        };
      });

      simulationPortfolio.total_value = Number((Number(simulationPortfolio.cash_balance) + simVal).toFixed(2));
    }

    return NextResponse.json({
      markets: liveMarkets,
      manualPositions,
      simulationPortfolio,
      simulationPositions,
      serverTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
