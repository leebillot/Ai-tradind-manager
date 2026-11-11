import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

function getSupabase() {
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  try {
    const parsed = new URL(rawUrl);
    rawUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {}
  let rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
  return createClient(rawUrl, rawKey);
}

// UNIVERS BOURSIER AVEC DEVISES ET COTATIONS CALIBRÉES
const WATCHLIST = [
  // --- PARIS (EURONEXT - DEVISE €) ---
  { ticker: 'DSY.PA', name: 'Dassault Systèmes SE', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'LOGICIELS / IA 3D', fallbackPrice: 25.40, fallbackHigh: 25.64, fallbackLow: 25.16, fallbackOpen: 25.22, volume: '360,1 k', per: '25,77', cap: '33,53 Md €', h52: '38,20 €', b52: '24,10 €', catalyst: 'Croissance à deux chiffres des licences cloud 3DEXPERIENCE et jumeaux virtuels.' },
  { ticker: 'AM.PA', name: 'Dassault Aviation', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'DÉFENSE / AÉRO', fallbackPrice: 198.50, fallbackHigh: 200.20, fallbackLow: 196.10, fallbackOpen: 197.00, volume: '220,4 k', per: '18,10', cap: '16,50 Md €', h52: '210,00 €', b52: '168,00 €', catalyst: 'Commandes records à l’export pour les avions de combat Rafale.' },
  { ticker: 'AIR.PA', name: 'Airbus SE', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'AÉRONAUTIQUE', fallbackPrice: 141.20, fallbackHigh: 142.80, fallbackLow: 140.10, fallbackOpen: 140.50, volume: '950,4 k', per: '26,80', cap: '111,20 Md €', h52: '172,00 €', b52: '124,00 €', catalyst: 'Cadences de livraisons d’avions commerciaux A320/A321 en nette hausse.' },
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'LUXE MONDIAL', fallbackPrice: 624.00, fallbackHigh: 628.50, fallbackLow: 618.00, fallbackOpen: 620.00, volume: '410,2 k', per: '21,50', cap: '312,40 Md €', h52: '885,00 €', b52: '582,00 €', catalyst: 'Stabilisation de la demande en Asie et fort pricing power.' },
  { ticker: 'SU.PA', name: 'Schneider Electric', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'INFRA DATA CENTERS', fallbackPrice: 242.00, fallbackHigh: 244.50, fallbackLow: 239.50, fallbackOpen: 240.00, volume: '890,5 k', per: '31,20', cap: '136,20 Md €', h52: '248,00 €', b52: '155,00 €', catalyst: 'Équipement électrique indispensable des data centers IA mondiaux.' },
  { ticker: 'RMS.PA', name: 'Hermès International', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'ULTRA-LUXE', fallbackPrice: 2080.00, fallbackHigh: 2100.00, fallbackLow: 2060.00, fallbackOpen: 2070.00, volume: '65,1 k', per: '48,20', cap: '218,60 Md €', h52: '2430,00 €', b52: '1850,00 €', catalyst: 'Commandes saturées et marges opérationnelles record.' },
  { ticker: 'TTE.PA', name: 'TotalEnergies', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'ÉNERGIE / DIVIDENDES', fallbackPrice: 58.40, fallbackHigh: 59.10, fallbackLow: 57.90, fallbackOpen: 58.20, volume: '3,20 M', per: '7,40', cap: '139,50 Md €', h52: '70,00 €', b52: '56,20 €', catalyst: 'Rendement du dividende élevé (7%) et politique de rachat d’actions.' },

  // --- WALL STREET (US - DEVISE $) ---
  { ticker: 'MSFT', name: 'Microsoft Corp', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'CLOUD GÉANT', fallbackPrice: 522.88, fallbackHigh: 534.76, fallbackLow: 518.45, fallbackOpen: 534.22, volume: '19,5 M', per: '34,20', cap: '3 880 Md $', h52: '555,00 $', b52: '388,00 $', catalyst: 'Monétisation accélérée d’Azure OpenAI et des postes Copilot en entreprise.' },
  { ticker: 'PLTR', name: 'Palantir Technologies', market: 'US', currency: '$', place: 'NYSE · USD', category: 'IA / DÉFENSE', fallbackPrice: 44.50, fallbackHigh: 45.80, fallbackLow: 43.10, fallbackOpen: 43.50, volume: '45,8 M', per: '92,00', cap: '101,20 Md $', h52: '45,80 $', b52: '15,20 $', catalyst: 'Signature de méga-contrats militaires US et forte adoption de la plateforme AIP.' },
  { ticker: 'NVDA', name: 'Nvidia Corp', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'SEMI-CONDUCTEURS', fallbackPrice: 142.50, fallbackHigh: 144.20, fallbackLow: 139.80, fallbackOpen: 140.50, volume: '58,4 M', per: '52,30', cap: '3 510 Md $', h52: '144,00 $', b52: '45,00 $', catalyst: 'Demande record de puces Blackwell et marges brutes de 75%.' },
  { ticker: 'TSLA', name: 'Tesla Inc', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'AUTO / ROBOTIQUE', fallbackPrice: 254.00, fallbackHigh: 259.00, fallbackLow: 248.50, fallbackOpen: 250.00, volume: '62,1 M', per: '74,10', cap: '815 Md $', h52: '271,00 $', b52: '138,00 $', catalyst: 'Homologation FSD et déploiement du réseau de Robotaxis.' },
  { ticker: 'ASTS', name: 'AST SpaceMobile', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'SPATIAL / TÉLÉCOM', fallbackPrice: 26.40, fallbackHigh: 27.50, fallbackLow: 24.80, fallbackOpen: 25.20, volume: '14,2 M', per: 'N/A', cap: '7,10 Md $', h52: '39,00 $', b52: '2,10 $', catalyst: 'Déploiement constellation satellite 5G directe aux smartphones.' },
  { ticker: 'APP', name: 'AppLovin Corp', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'ADTECH / IA', fallbackPrice: 285.00, fallbackHigh: 292.00, fallbackLow: 275.00, fallbackOpen: 278.00, volume: '6,1 M', per: '68,50', cap: '96,40 Md $', h52: '295,00 $', b52: '38,00 $', catalyst: 'Moteur publicitaire AXON IA générant des flux de trésorerie records.' },
  { ticker: 'AAPL', name: 'Apple Inc', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'TECH / HARDWARE', fallbackPrice: 231.00, fallbackHigh: 233.20, fallbackLow: 229.50, fallbackOpen: 230.00, volume: '41,2 M', per: '33,80', cap: '3 490 Md $', h52: '237,00 $', b52: '164,00 $', catalyst: 'Cycle de renouvellement d’appareils porté par Apple Intelligence.' }
];

// RECUPERATION EN DIRECT DU FLUX YAHOO FINANCE
async function fetchYahooLive(ticker: string, fallback: any, forceFresh: boolean) {
  try {
    const fetchOptions: RequestInit = forceFresh 
      ? { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' } }
      : { next: { revalidate: 30 }, headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' } };

    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=2m&range=1d`, fetchOptions);

    if (res.ok) {
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (result) {
        const meta = result.meta;
        const closes: number[] = (result.indicators?.quote?.[0]?.close || []).filter((c: any) => typeof c === 'number' && !isNaN(c));
        
        const livePrice = Number((meta.regularMarketPrice || (closes.length > 0 ? closes[closes.length - 1] : fallback.fallbackPrice)).toFixed(2));
        const prevClose = Number((meta.chartPreviousClose || livePrice).toFixed(2));
        
        // SYNCHRONISATION ABSOLUE : Le Max est au moins égal au cours actuel
        const rawHigh = meta.regularMarketDayHigh || (closes.length > 0 ? Math.max(...closes) : fallback.fallbackHigh);
        const rawLow = meta.regularMarketDayLow || (closes.length > 0 ? Math.min(...closes) : fallback.fallbackLow);
        const dayHigh = Number(Math.max(rawHigh, livePrice).toFixed(2));
        const dayLow = Number(Math.min(rawLow, livePrice).toFixed(2));
        const dayOpen = Number((meta.regularMarketDayLow ? prevClose : (closes[0] || fallback.fallbackOpen)).toFixed(2));

        const changeVal = Number((((livePrice - prevClose) / prevClose) * 100).toFixed(2));

        return {
          price: livePrice,
          high: dayHigh,
          low: dayLow,
          open: dayOpen,
          prevClose,
          changeVal,
          volume: meta.regularMarketVolume ? `${(meta.regularMarketVolume / 1000).toFixed(1)} k` : fallback.volume,
          liveCloses: closes
        };
      }
    }
  } catch (err) {}

  const p = fallback.fallbackPrice;
  return {
    price: p,
    high: Math.max(fallback.fallbackHigh, p),
    low: Math.min(fallback.fallbackLow, p),
    open: fallback.fallbackOpen,
    prevClose: fallback.fallbackOpen,
    changeVal: Number((((p - fallback.fallbackOpen) / fallback.fallbackOpen) * 100).toFixed(2)),
    volume: fallback.volume,
    liveCloses: []
  };
}

// GÉNÉRATEUR AVEC HEURES RÉELLES GLISSANTES ET MODE "1H"
function buildDynamicTimelineChart(price: number, high: number, low: number, open: number, changeVal: number, closes: number[]) {
  const now = new Date();
  
  // Fonction de formatage 24h français (ex: 16h23)
  const formatHourMin = (d: Date) => {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}h${m}`;
  };

  // 1H : FENÊTRE GLISSANTE DES 60 DERNIÈRES MINUTES
  const buildLastHour = () => {
    const pointsCount = 45;
    const series: { label: string; price: number }[] = [];
    let curr = price * (changeVal >= 0 ? 0.992 : 1.008);
    const step = (price - curr) / pointsCount;

    for (let i = 0; i < pointsCount; i++) {
      const noise = (Math.sin(i * 0.7) + (Math.random() - 0.49)) * (price * 0.001);
      curr = Math.max(low, Math.min(high, curr + step + noise));
      series.push({ label: `${i}`, price: Number(curr.toFixed(2)) });
    }
    series[series.length - 1].price = price;

    // Repères temporels glissants réels
    const tMinus45 = new Date(now.getTime() - 45 * 60000);
    const tMinus30 = new Date(now.getTime() - 30 * 60000);
    const tMinus15 = new Date(now.getTime() - 15 * 60000);

    return {
      points: series,
      high, low, open, close: price,
      xMarkers: [formatHourMin(tMinus45), formatHourMin(tMinus30), formatHourMin(tMinus15), formatHourMin(now)],
      scaleSteps: [high, Number((low + (high - low) * 0.66).toFixed(2)), Number((low + (high - low) * 0.33).toFixed(2)), low]
    };
  };

  // 1J : SÉANCE DE TRADING AVEC HEURE ACTUELLE
  const buildOneDay = () => {
    const pointsCount = 60;
    let series: { label: string; price: number }[] = [];

    if (closes.length >= 10) {
      const stride = Math.max(1, Math.floor(closes.length / pointsCount));
      series = closes.filter((_, i) => i % stride === 0).map((c, i) => ({
        label: `${i}`,
        price: Number(c.toFixed(2))
      }));
      series[series.length - 1].price = price;
    } else {
      let curr = open;
      const step = (price - open) / pointsCount;
      for (let i = 0; i < pointsCount; i++) {
        const noise = (Math.sin(i * 0.4) * 0.4 + (Math.random() - 0.49) * 0.8) * (price * 0.003);
        curr = Math.max(low, Math.min(high, curr + step + noise));
        series.push({ label: `${i}`, price: Number(curr.toFixed(2)) });
      }
      series[series.length - 1].price = price;
    }

    // Heures françaises adaptées
    const currentH = now.getHours();
    const h1 = Math.max(9, currentH - 4);
    const h2 = Math.max(10, currentH - 2);
    const h3 = currentH;

    return {
      points: series,
      high, low, open, close: price,
      xMarkers: [`${h1}h`, `${h2}h`, `${h3}h`, formatHourMin(now)],
      scaleSteps: [high, Number((low + (high - low) * 0.66).toFixed(2)), Number((low + (high - low) * 0.33).toFixed(2)), low]
    };
  };

  const buildStandard = (count: number, labels: string[], vol: number) => {
    const series: { label: string; price: number }[] = [];
    let curr = open;
    const step = (price - open) / count;
    for (let i = 0; i < count; i++) {
      const noise = (Math.sin(i * 0.5) + (Math.random() - 0.49)) * (price * vol);
      curr = Math.max(low, Math.min(high, curr + step + noise));
      series.push({ label: `${i}`, price: Number(curr.toFixed(2)) });
    }
    series[series.length - 1].price = price;

    return {
      points: series,
      high, low, open, close: price,
      xMarkers: labels,
      scaleSteps: [high, Number((low + (high - low) * 0.66).toFixed(2)), Number((low + (high - low) * 0.33).toFixed(2)), low]
    };
  };

  return {
    '1H': buildLastHour(),
    '1D': buildOneDay(),
    '1W': buildStandard(50, ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], 0.012),
    '1M': buildStandard(55, ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], 0.025),
    '3M': buildStandard(60, ['Mois 1', 'Mois 2', 'Mois 3'], 0.04),
    '1Y': buildStandard(70, ['T1', 'T2', 'T3', 'T4'], 0.07)
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
        const live = await fetchYahooLive(target.ticker, target, true);

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
    const forceFresh = searchParams.get('fresh') === 'true';

    // RÉCUPÉRATION DU COURS EN DIRECT
    const liveMarkets = await Promise.all(
      WATCHLIST.map(async (item) => {
        const live = await fetchYahooLive(item.ticker, item, forceFresh);
        const changeStr = (live.changeVal >= 0 ? '+' : '') + live.changeVal.toFixed(2).replace('.', ',') + ' %';

        let aiSignal = 'CONSERVER';
        let aiColor = 'YELLOW';
        let aiConfidence = 82;

        if (live.changeVal >= 2.0) {
          aiSignal = 'ACHAT FORT';
          aiColor = 'GREEN_DARK';
          aiConfidence = 96;
        } else if (live.changeVal >= 0.5) {
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
          history: buildDynamicTimelineChart(live.price, live.high, live.low, live.open, live.changeVal, live.liveCloses),
          aiAdvice: aiColor === 'GREEN_DARK' 
            ? `Alerte IA : Forte poussée de cotation (+${live.changeVal}%). Volumes massifs et dynamique haussière très solide.`
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
          history: live?.history,
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
          history: live?.history,
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
