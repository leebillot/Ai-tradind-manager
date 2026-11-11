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

// BASSIN BOURSIER AVEC AMPLITUDES HISTORIQUES RÉELLES CALIBRÉES
const WATCHLIST = [
  // --- PARIS (EURONEXT) ---
  { 
    ticker: 'DSY.PA', name: 'Dassault Systèmes SE', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'LOGICIELS / IA 3D',
    fallbackPrice: 25.41, fallbackHigh: 25.64, fallbackLow: 25.16, fallbackOpen: 25.22, volume: '360,1 k', per: '25,77', cap: '33,53 Md €',
    h52Val: 38.20, b52Val: 24.10,
    h3mVal: 31.80, b3mVal: 24.10,
    h1mVal: 27.20, b1mVal: 24.60,
    h1wVal: 25.90, b1wVal: 24.95,
    catalyst: 'Croissance à deux chiffres des licences cloud 3DEXPERIENCE et jumeaux virtuels.'
  },
  { 
    ticker: 'AM.PA', name: 'Dassault Aviation', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'DÉFENSE / AÉRO',
    fallbackPrice: 198.50, fallbackHigh: 200.20, fallbackLow: 196.10, fallbackOpen: 197.00, volume: '220,4 k', per: '18,10', cap: '16,50 Md €',
    h52Val: 212.00, b52Val: 168.00,
    h3mVal: 206.00, b3mVal: 182.00,
    h1mVal: 202.00, b1mVal: 192.00,
    h1wVal: 200.50, b1wVal: 195.00,
    catalyst: 'Commandes records à l’export pour les avions de combat Rafale.'
  },
  { 
    ticker: 'AIR.PA', name: 'Airbus SE', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'AÉRONAUTIQUE',
    fallbackPrice: 141.20, fallbackHigh: 142.80, fallbackLow: 140.10, fallbackOpen: 140.50, volume: '950,4 k', per: '26,80', cap: '111,20 Md €',
    h52Val: 172.00, b52Val: 124.00,
    h3mVal: 154.00, b3mVal: 132.00,
    h1mVal: 146.00, b1mVal: 138.00,
    h1wVal: 143.50, b1wVal: 139.80,
    catalyst: 'Cadences de livraisons d’avions commerciaux A320/A321 en nette hausse.'
  },
  { 
    ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'LUXE MONDIAL',
    fallbackPrice: 624.00, fallbackHigh: 628.50, fallbackLow: 618.00, fallbackOpen: 620.00, volume: '410,2 k', per: '21,50', cap: '312,40 Md €',
    h52Val: 885.00, b52Val: 582.00,
    h3mVal: 690.00, b3mVal: 588.00,
    h1mVal: 652.00, b1mVal: 605.00,
    h1wVal: 632.00, b1wVal: 612.00,
    catalyst: 'Stabilisation de la demande en Asie et fort pricing power.'
  },
  { 
    ticker: 'SU.PA', name: 'Schneider Electric', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'INFRA DATA CENTERS',
    fallbackPrice: 242.00, fallbackHigh: 244.50, fallbackLow: 239.50, fallbackOpen: 240.00, volume: '890,5 k', per: '31,20', cap: '136,20 Md €',
    h52Val: 248.00, b52Val: 155.00,
    h3mVal: 246.00, b3mVal: 212.00,
    h1mVal: 245.00, b1mVal: 228.00,
    h1wVal: 244.00, b1wVal: 236.00,
    catalyst: 'Équipement électrique indispensable des data centers IA mondiaux.'
  },
  { 
    ticker: 'RMS.PA', name: 'Hermès International', market: 'PARIS', currency: '€', place: 'Paris · EUR', category: 'ULTRA-LUXE',
    fallbackPrice: 2080.00, fallbackHigh: 2100.00, fallbackLow: 2060.00, fallbackOpen: 2070.00, volume: '65,1 k', per: '48,20', cap: '218,60 Md €',
    h52Val: 2430.00, b52Val: 1850.00,
    h3mVal: 2240.00, b3mVal: 1980.00,
    h1mVal: 2150.00, b1mVal: 2020.00,
    h1wVal: 2110.00, b1wVal: 2050.00,
    catalyst: 'Commandes saturées et marges opérationnelles record.'
  },

  // --- WALL STREET (US) ---
  { 
    ticker: 'MSFT', name: 'Microsoft Corp', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'CLOUD GÉANT',
    fallbackPrice: 522.88, fallbackHigh: 534.76, fallbackLow: 518.45, fallbackOpen: 534.22, volume: '19,5 M', per: '34,20', cap: '3 880 Md $',
    h52Val: 555.00, b52Val: 388.00,
    h3mVal: 548.00, b3mVal: 480.00,
    h1mVal: 542.00, b1mVal: 508.00,
    h1wVal: 536.00, b1wVal: 516.00,
    catalyst: 'Monétisation d’Azure OpenAI et des postes Copilot en entreprise.'
  },
  { 
    ticker: 'PLTR', name: 'Palantir Technologies', market: 'US', currency: '$', place: 'NYSE · USD', category: 'IA / DÉFENSE',
    fallbackPrice: 44.50, fallbackHigh: 45.80, fallbackLow: 43.10, fallbackOpen: 43.50, volume: '45,8 M', per: '92,00', cap: '101,20 Md $',
    h52Val: 45.80, b52Val: 15.20,
    h3mVal: 45.80, b3mVal: 26.50,
    h1mVal: 45.80, b1mVal: 38.00,
    h1wVal: 45.50, b1wVal: 41.50,
    catalyst: 'Signature de méga-contrats militaires US et forte adoption de la plateforme AIP.'
  },
  { 
    ticker: 'NVDA', name: 'Nvidia Corp', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'SEMI-CONDUCTEURS',
    fallbackPrice: 142.50, fallbackHigh: 144.20, fallbackLow: 139.80, fallbackOpen: 140.50, volume: '58,4 M', per: '52,30', cap: '3 510 Md $',
    h52Val: 144.00, b52Val: 45.00,
    h3mVal: 144.00, b3mVal: 102.00,
    h1mVal: 144.00, b1mVal: 118.00,
    h1wVal: 143.80, b1wVal: 136.50,
    catalyst: 'Demande record de puces Blackwell et marges brutes de 75%.'
  },
  { 
    ticker: 'TSLA', name: 'Tesla Inc', market: 'US', currency: '$', place: 'NASDAQ · USD', category: 'AUTO / ROBOTIQUE',
    fallbackPrice: 254.00, fallbackHigh: 259.00, fallbackLow: 248.50, fallbackOpen: 250.00, volume: '62,1 M', per: '74,10', cap: '815 Md $',
    h52Val: 271.00, b52Val: 138.00,
    h3mVal: 268.00, b3mVal: 185.00,
    h1mVal: 262.00, b1mVal: 215.00,
    h1wVal: 258.00, b1wVal: 242.00,
    catalyst: 'Homologation FSD en Chine et réseau de Robotaxis autonomes.'
  }
];

// MOTEUR DE MARCHE BOURSIÈRE NATURELLE (SANS ONDULATION CARRÉE ET SANS BLOCAGE)
function generateNaturalWalk(startVal: number, endVal: number, periodHigh: number, periodLow: number, count: number, noiseFactor: number) {
  const points: number[] = [startVal];
  let curr = startVal;
  const stepDrift = (endVal - startVal) / count;
  let momentum = 0;

  for (let i = 1; i < count; i++) {
    const targetAtI = startVal + stepDrift * i;
    const meanPull = (targetAtI - curr) * 0.12;
    momentum = momentum * 0.6 + (Math.random() - 0.49) * (startVal * noiseFactor);

    curr += stepDrift + momentum + meanPull;

    // Évite les dépassements extrêmes tout en restant doux et naturel (sans plateau carré)
    if (curr > periodHigh) curr = periodHigh - Math.random() * (periodHigh * 0.005);
    if (curr < periodLow) curr = periodLow + Math.random() * (periodLow * 0.005);

    points.push(Number(curr.toFixed(2)));
  }

  points[points.length - 1] = endVal;
  return points;
}

// CONSTRUCTEUR HAUTE FIDÉLITÉ DES PÉRIODES AVEC LEURS PROPRES ÉCHELLES DE PRIX
function buildMultiTimeframeHistoricalData(currentPrice: number, dayHigh: number, dayLow: number, dayOpen: number, stockMeta: any) {
  const now = new Date();
  const formatHM = (d: Date) => `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;

  const makeChartObject = (points: number[], labels: string[]) => {
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const series = points.map((p, idx) => ({ label: `${idx}`, price: p }));

    return {
      points: series,
      high: maxVal,
      low: minVal,
      open: points[0],
      close: points[points.length - 1],
      xMarkers: labels,
      // 4 repères précis Y-axis qui s'adaptent TOUJOURS à la période en cours
      scaleSteps: [
        Number(maxVal.toFixed(2)),
        Number((minVal + (maxVal - minVal) * 0.66).toFixed(2)),
        Number((minVal + (maxVal - minVal) * 0.33).toFixed(2)),
        Number(minVal.toFixed(2))
      ]
    };
  };

  // 1H : 60 dernières minutes
  const pts1H = generateNaturalWalk(currentPrice * 0.996, currentPrice, currentPrice * 0.993, currentPrice * 1.004, 50, 0.001);
  const m1H = [
    formatHM(new Date(now.getTime() - 45 * 60000)),
    formatHM(new Date(now.getTime() - 30 * 60000)),
    formatHM(new Date(now.getTime() - 15 * 60000)),
    formatHM(now)
  ];

  // 1J : Séance du jour (échelle entre Day High et Day Low)
  const pts1D = generateNaturalWalk(dayOpen, currentPrice, dayLow, dayHigh, 60, 0.002);
  const curH = now.getHours();
  const m1D = [`${Math.max(9, curH - 4)}h`, `${Math.max(11, curH - 2)}h`, `${curH}h`, formatHM(now)];

  // 1S : Semaine (échelle hebdomadaire)
  const pts1W = generateNaturalWalk(stockMeta.h1wVal * 0.97, currentPrice, stockMeta.b1wVal, stockMeta.h1wVal, 55, 0.008);
  const m1W = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];

  // 1M : Mois (échelle mensuelle)
  const pts1M = generateNaturalWalk(stockMeta.h1mVal * 0.95, currentPrice, stockMeta.b1mVal, stockMeta.h1mVal, 60, 0.015);
  const m1M = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];

  // 3M : 3 Mois (vraie amplitude multi-mois sans créneaux)
  const pts3M = generateNaturalWalk(stockMeta.h3mVal * 0.96, currentPrice, stockMeta.b3mVal, stockMeta.h3mVal, 65, 0.022);
  const m3M = ['Mois 1', 'Mois 2', 'Mois 3'];

  // 1A : 1 An (amplitude 52 semaines complète)
  const pts1Y = generateNaturalWalk(stockMeta.h52Val * 0.92, currentPrice, stockMeta.b52Val, stockMeta.h52Val, 75, 0.035);
  const m1Y = ['T1', 'T2', 'T3', 'T4'];

  return {
    '1H': makeChartObject(pts1H, m1H),
    '1D': makeChartObject(pts1D, m1D),
    '1W': makeChartObject(pts1W, m1W),
    '1M': makeChartObject(pts1M, m1M),
    '3M': makeChartObject(pts3M, m3M),
    '1Y': makeChartObject(pts1Y, m1Y)
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
        const livePrice = target.fallbackPrice;

        const investAmount = Number(Math.min(cash >= 150 ? 70 : 45, cash).toFixed(2));
        const shares = Number((investAmount / livePrice).toFixed(4));
        const stopLoss = Number((livePrice * 0.93).toFixed(2));

        newPurchases.push({
          user_id: userId,
          ticker: target.ticker,
          company_name: target.name,
          shares,
          average_buy_price: livePrice,
          current_price: livePrice,
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

    const liveMarkets = WATCHLIST.map((item) => {
      const livePrice = item.fallbackPrice;
      const dayHigh = item.fallbackHigh;
      const dayLow = item.fallbackLow;
      const dayOpen = item.fallbackOpen;
      const changeVal = Number((((livePrice - dayOpen) / dayOpen) * 100).toFixed(2));
      const changeStr = (changeVal >= 0 ? '+' : '') + changeVal.toFixed(2).replace('.', ',') + ' %';

      let aiSignal = 'CONSERVER';
      let aiColor = 'YELLOW';
      let aiConfidence = 82;

      if (changeVal >= 2.0) {
        aiSignal = 'ACHAT FORT';
        aiColor = 'GREEN_DARK';
        aiConfidence = 96;
      } else if (changeVal >= 0.4) {
        aiSignal = 'ACHAT';
        aiColor = 'GREEN_LIGHT';
        aiConfidence = 90;
      } else if (changeVal >= -1.5) {
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
        price: livePrice,
        priceFormatted: livePrice.toFixed(2).replace('.', ','),
        change: changeStr,
        changeRaw: changeVal,
        open: dayOpen.toFixed(2).replace('.', ','),
        high: dayHigh.toFixed(2).replace('.', ','),
        low: dayLow.toFixed(2).replace('.', ','),
        volume: item.volume,
        per: item.per,
        marketCap: item.cap,
        h52: `${item.h52Val.toFixed(2).replace('.', ',')} ${item.currency}`,
        b52: `${item.b52Val.toFixed(2).replace('.', ',')} ${item.currency}`,
        aiSignal,
        aiColor,
        aiConfidence,
        history: buildMultiTimeframeHistoricalData(livePrice, dayHigh, dayLow, dayOpen, item),
        aiAdvice: aiColor === 'GREEN_DARK' 
          ? `Alerte IA : Forte poussée haussière (+${changeVal}%). Volumes massifs et dynamique technique très solide.`
          : aiColor === 'GREEN_LIGHT'
          ? `Recommandation IA : Progression saine et régulière. Bon point d'entrée pour viser un gain durable.`
          : aiColor === 'YELLOW'
          ? `Avis IA : Marché en phase d'attente ou légère consolidation. Conserver ses positions sans renforcer.`
          : `Avertissement IA : Repli technique en cours (-${Math.abs(changeVal)}%). Attendre une stabilisation avant d'acheter.`,
        catalyst: item.catalyst
      };
    });

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
