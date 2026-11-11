import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

function getSupabase() {
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  try {
    const parsed = new URL(rawUrl);
    rawUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {}
  let rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
  return createClient(rawUrl, rawKey);
}

// UNIVERS BOURSIER AVEC MÉTRIQUES COMPLÈTES CONFORMES À L'APPLICATION BOURSE D'APPLE
const BASE_MARKET_UNIVERSE = [
  // --- BOURSE DE PARIS (EURONEXT) ---
  { 
    ticker: 'DSY.PA', name: 'Dassault Systèmes SE', market: 'PARIS', currency: 'EUR', place: 'Paris · EUR',
    basePrice: 25.51, category: 'LOGICIELS / IA 3D', keywords: 'dassault systemes 3d cad tech france dsy',
    volatility: 3.5, catalyst: 'Croissance à deux chiffres des licences cloud 3DEXPERIENCE et jumeaux virtuels.',
    aiBaseAdvice: 'Leader mondial du logiciel 3D. Support technique solide autour des 25 €, profil d’accumulation idéal.',
    open: 25.22, high: 25.64, low: 25.16, volume: '360,1 k', per: '25,77', marketCap: '33,53 Md €', h52: '38,20 €', b52: '24,10 €'
  },
  { 
    ticker: 'AM.PA', name: 'Dassault Aviation', market: 'PARIS', currency: 'EUR', place: 'Paris · EUR',
    basePrice: 198.50, category: 'DÉFENSE / AÉRO', keywords: 'dassault aviation rafale falcon defense armee',
    volatility: 4.2, catalyst: 'Commandes records à l’export pour les avions de combat Rafale.',
    aiBaseAdvice: 'Visibilité financière record sur 10 ans. Rempart défensif idéal contre l’inflation.',
    open: 196.20, high: 199.80, low: 195.50, volume: '220,4 k', per: '18,10', marketCap: '16,50 Md €', h52: '210,00 €', b52: '168,00 €'
  },
  { 
    ticker: 'VU.PA', name: 'VusionGroup (SES-imagotag)', market: 'PARIS', currency: 'EUR', place: 'Paris · EUR',
    basePrice: 148.00, category: 'IOT / RETAIL IA', keywords: 'vusion ses imagotag walmart retail iot',
    volatility: 6.5, catalyst: 'Déploiement massif des étiquettes intelligentes chez Walmart US.',
    aiBaseAdvice: 'Pépite française leader mondial de l’IoT commercial. Forte rentabilité opérationnelle.',
    open: 144.50, high: 149.80, low: 143.00, volume: '180,2 k', per: '24,60', marketCap: '2,40 Md €', h52: '162,00 €', b52: '88,00 €'
  },
  { 
    ticker: 'SU.PA', name: 'Schneider Electric', market: 'PARIS', currency: 'EUR', place: 'Paris · EUR',
    basePrice: 242.00, category: 'INFRA DATA CENTERS', keywords: 'schneider electric data center energie transition',
    volatility: 3.8, catalyst: 'Équipement énergétique indispensable des data centers IA.',
    aiBaseAdvice: 'Hausse structurelle saine : profil de rendement très régulier porté par l’électrification.',
    open: 239.50, high: 243.20, low: 238.80, volume: '890,5 k', per: '31,20', marketCap: '136,20 Md €', h52: '248,00 €', b52: '155,00 €'
  },
  { 
    ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', currency: 'EUR', place: 'Paris · EUR',
    basePrice: 624.00, category: 'LUXE MONDIAL', keywords: 'lvmh luxe arnault louis vuitton dior',
    volatility: 2.8, catalyst: 'Stabilisation de la consommation haut de gamme en Asie et fort pricing power.',
    aiBaseAdvice: 'Support technique solide à 600 € : opportunité d’accumulation de long terme.',
    open: 618.00, high: 627.50, low: 615.00, volume: '410,2 k', per: '21,50', marketCap: '312,40 Md €', h52: '885,00 €', b52: '582,00 €'
  },
  { 
    ticker: 'RMS.PA', name: 'Hermès International', market: 'PARIS', currency: 'EUR', place: 'Paris · EUR',
    basePrice: 2080.00, category: 'ULTRA-LUXE', keywords: 'hermes birkin luxe maroquinerie',
    volatility: 2.2, catalyst: 'Commandes saturées et marges opérationnelles au sommet.',
    aiBaseAdvice: 'Le titre le plus solide de la cote européenne, imperméable aux crises.',
    open: 2060.00, high: 2095.00, low: 2050.00, volume: '65,1 k', per: '48,20', marketCap: '218,60 Md €', h52: '2430,00 €', b52: '1850,00 €'
  },
  { 
    ticker: 'AIR.PA', name: 'Airbus SE', market: 'PARIS', currency: 'EUR', place: 'Paris · EUR',
    basePrice: 141.20, category: 'AÉRONAUTIQUE', keywords: 'airbus avions a320 a350 defense',
    volatility: 3.2, catalyst: 'Cadences de livraisons d’avions commerciaux en hausse.',
    aiBaseAdvice: 'Carnet de commandes supérieur à 8 000 avions assurant une visibilité record.',
    open: 139.80, high: 142.10, low: 139.00, volume: '950,4 k', per: '26,80', marketCap: '111,20 Md €', h52: '172,00 €', b52: '124,00 €'
  },
  { 
    ticker: 'TTE.PA', name: 'TotalEnergies', market: 'PARIS', currency: 'EUR', place: 'Paris · EUR',
    basePrice: 58.40, category: 'ÉNERGIE / DIVIDENDES', keywords: 'total energies petrol gaz dividende',
    volatility: 2.5, catalyst: 'Rendement du dividende élevé (7%) et rachats d’actions réguliers.',
    aiBaseAdvice: 'Actif de rendement très robuste sans volatilité excessive.',
    open: 58.10, high: 58.90, low: 57.80, volume: '3,20 M', per: '7,40', marketCap: '139,50 Md €', h52: '70,00 €', b52: '56,20 €'
  },

  // --- WALL STREET (US) : PÉPITES & GÉANTS ---
  { 
    ticker: 'ASTS', name: 'AST SpaceMobile', market: 'US', currency: 'USD', place: 'NASDAQ · USD',
    basePrice: 26.40, category: 'SPATIAL / TÉLÉCOM', keywords: 'asts space mobile satellite telecom 5g espace',
    volatility: 8.5, catalyst: 'Déploiement constellation satellite directe aux smartphones sans équipement spécial.',
    aiBaseAdvice: 'Petite capitalisation à très fort potentiel d’explosion. Fort effet de levier.',
    open: 24.80, high: 27.20, low: 24.30, volume: '14,2 M', per: 'N/A', marketCap: '7,10 Md $', h52: '39,00 €', b52: '2,10 €'
  },
  { 
    ticker: 'PLTR', name: 'Palantir Technologies', market: 'US', currency: 'USD', place: 'NYSE · USD',
    basePrice: 44.50, category: 'IA / DÉFENSE', keywords: 'palantir pltr karp ia data defense aip',
    volatility: 6.2, catalyst: 'Signature de méga-contrats militaires US et forte adoption de la plateforme AIP.',
    aiBaseAdvice: 'Croissance fulgurante des marges, leadership incontesté dans l’IA opérationnelle.',
    open: 42.10, high: 45.20, low: 41.80, volume: '45,8 M', per: '92,00', marketCap: '101,20 Md $', h52: '45,80 €', b52: '15,20 €'
  },
  { 
    ticker: 'APP', name: 'AppLovin Corp', market: 'US', currency: 'USD', place: 'NASDAQ · USD',
    basePrice: 285.00, category: 'ADTECH / IA', keywords: 'applovin app adtech pub mobile jeux ia',
    volatility: 7.8, catalyst: 'Moteur publicitaire AXON IA générant des flux de trésorerie records.',
    aiBaseAdvice: 'Pépite technologique en pleine accélération. Momentum institutionnel massif.',
    open: 272.00, high: 289.00, low: 268.00, volume: '6,1 M', per: '68,50', marketCap: '96,40 Md $', h52: '295,00 €', b52: '38,00 €'
  },
  { 
    ticker: 'NVDA', name: 'Nvidia Corp', market: 'US', currency: 'USD', place: 'NASDAQ · USD',
    basePrice: 142.50, category: 'SEMI-CONDUCTEURS', keywords: 'nvidia nvda puces gpu blackwell ia ai',
    volatility: 4.5, catalyst: 'Demande record de puces Blackwell et marges brutes de 75%.',
    aiBaseAdvice: 'Pilier mondial du secteur IA avec valorisation encore justifiée par le carnet de commandes.',
    open: 139.50, high: 143.80, low: 138.90, volume: '58,4 M', per: '52,30', marketCap: '3 510 Md $', h52: '144,00 €', b52: '45,00 €'
  },
  { 
    ticker: 'TSLA', name: 'Tesla Inc', market: 'US', currency: 'USD', place: 'NASDAQ · USD',
    basePrice: 254.00, category: 'AUTO / ROBOTIQUE', keywords: 'tesla tsla elon musk fsd robotaxi cybercab',
    volatility: 5.5, catalyst: 'Homologation FSD en Chine et réseau de Robotaxis autonomes.',
    aiBaseAdvice: 'Forte sensibilité aux annonces d’Elon Musk. Bons points d’entrée sur repli.',
    open: 248.00, high: 258.40, low: 246.00, volume: '62,1 M', per: '74,10', marketCap: '815 Md $', h52: '271,00 €', b52: '138,00 €'
  },
  { 
    ticker: 'MSFT', name: 'Microsoft Corp', market: 'US', currency: 'USD', place: 'NASDAQ · USD',
    basePrice: 428.00, category: 'CLOUD GÉANT', keywords: 'microsoft msft windows azure openai copilot',
    volatility: 2.1, catalyst: 'Monétisation d’Azure OpenAI et des postes de travail Copilot en entreprise.',
    aiBaseAdvice: 'Grande stabilité défensive, risque de baisse quasi nul.',
    open: 424.00, high: 429.50, low: 422.00, volume: '19,5 M', per: '34,20', marketCap: '3 180 Md $', h52: '468,00 €', b52: '366,00 €'
  },
  { 
    ticker: 'AAPL', name: 'Apple Inc', market: 'US', currency: 'USD', place: 'NASDAQ · USD',
    basePrice: 231.00, category: 'TECH / HARDWARE', keywords: 'apple aapl iphone ipad mac intelligence',
    volatility: 2.0, catalyst: 'Cycle de renouvellement d’appareils porté par Apple Intelligence.',
    aiBaseAdvice: 'Générateur de cash massif et politique de rachats d’actions ininterrompue.',
    open: 229.50, high: 232.40, low: 228.80, volume: '41,2 M', per: '33,80', marketCap: '3 490 Md $', h52: '237,00 €', b52: '164,00 €'
  }
];

// Générateur haute fidélité pour les séries 1J, 1S, 1M, 3M, 6M, 1A
function generateChartPoints(basePrice: number, changeVal: number) {
  const build = (count: number, volatility: number, timeLabels: string[]) => {
    let p = basePrice * (changeVal >= 0 ? 0.96 : 1.03);
    const data: { label: string; price: number }[] = [];
    for (let i = 0; i < count; i++) {
      const step = (Math.sin(i * 1.5) + (Math.random() - 0.48)) * volatility;
      p = Math.max(1, p + step);
      data.push({ label: timeLabels[i] || `${i}`, price: Number(p.toFixed(2)) });
    }
    data[data.length - 1].price = Number((basePrice * (1 + changeVal / 100)).toFixed(2));
    const prices = data.map(d => d.price);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    return {
      points: data,
      high: max,
      low: min,
      open: data[0].price,
      close: data[data.length - 1].price,
      // 4 repères précis Y-axis comme Apple Stocks
      scaleSteps: [
        Number(max.toFixed(2)),
        Number((min + (max - min) * 0.66).toFixed(2)),
        Number((min + (max - min) * 0.33).toFixed(2)),
        Number(min.toFixed(2))
      ]
    };
  };

  const dayLabels = ['09:00', '11:00', '13:00', '15:00', '17:00', '17:30'];
  const weekLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
  const monthLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  const threeMonthLabels = ['Mois 1', 'Mois 2', 'Mois 3'];
  const sixMonthLabels = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
  const yearLabels = ['T1', 'T2', 'T3', 'T4', 'Actuel'];

  return {
    '1D': build(6, basePrice * 0.008, dayLabels),
    '1W': build(5, basePrice * 0.015, weekLabels),
    '1M': build(4, basePrice * 0.025, monthLabels),
    '3M': build(3, basePrice * 0.038, threeMonthLabels),
    '6M': build(6, basePrice * 0.055, sixMonthLabels),
    '1Y': build(5, basePrice * 0.075, yearLabels)
  };
}

function generateDynamicMarket() {
  return BASE_MARKET_UNIVERSE.map(item => {
    const randomFactor = (Math.sin(Date.now() / 15000 + item.basePrice) * 0.7) + (Math.cos(item.basePrice) * 0.3);
    const changeVal = Number((randomFactor * item.volatility).toFixed(2));
    const livePrice = Number((item.basePrice * (1 + changeVal / 100)).toFixed(2));
    const changeStr = (changeVal >= 0 ? '+' : '') + changeVal.toFixed(2).replace('.', ',') + ' %';

    let aiSignal = 'CONSERVER';
    let aiColor = 'YELLOW';
    let aiConfidence = 82;

    if (changeVal >= 4.5) {
      aiSignal = 'ACHAT FORT';
      aiColor = 'GREEN_DARK';
      aiConfidence = 96;
    } else if (changeVal >= 1.0) {
      aiSignal = 'ACHAT';
      aiColor = 'GREEN_LIGHT';
      aiConfidence = 90;
    } else if (changeVal >= -1.5) {
      aiSignal = 'ATTENTION / CONSERVER';
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
      price: livePrice,
      priceFormatted: livePrice.toFixed(2).replace('.', ','),
      change: changeStr,
      changeRaw: changeVal,
      category: item.category,
      keywords: item.keywords,
      open: item.open.toFixed(2).replace('.', ','),
      high: item.high.toFixed(2).replace('.', ','),
      low: item.low.toFixed(2).replace('.', ','),
      volume: item.volume,
      per: item.per,
      marketCap: item.marketCap,
      h52: item.h52,
      b52: item.b52,
      aiSignal,
      aiColor,
      aiConfidence,
      history: generateChartPoints(item.basePrice, changeVal),
      aiAdvice: aiColor === 'GREEN_DARK' 
        ? `Alerte IA Prioritaire : Forte accélération (+${changeVal}%). Volumes massifs et dynamique haussière très solide.`
        : aiColor === 'GREEN_LIGHT'
        ? `Recommandation IA : Progression saine et régulière. Bon point d'entrée pour viser un gain durable.`
        : aiColor === 'YELLOW'
        ? `Avis IA : Marché en phase d'attente ou légère consolidation. Conserver ses positions sans renforcer.`
        : `Avertissement IA : Repli technique en cours (-${Math.abs(changeVal)}%). Attendre une stabilisation avant d'acheter.`,
      catalyst: item.catalyst
    };
  }).sort((a, b) => b.changeRaw - a.changeRaw);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non identifié.' }, { status: 401 });
    }

    const currentMarkets = generateDynamicMarket();

    // 1. AJOUT DE POSITION MANUELLE
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

    // 2. SUPPRESSION
    if (action === 'DELETE_MANUAL_POSITION') {
      const { positionId } = body;
      await supabase.from('manual_portfolio').delete().eq('id', positionId).eq('user_id', userId);
      return NextResponse.json({ success: true, message: 'Position supprimée.' });
    }

    // 3. RESET SIMULATION 500 €
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

    // 4. CYCLE AUTO-SIMULATION
    if (action === 'AUTO_SIMULATION_STEP') {
      let { data: simPort } = await supabase.from('simulation_portfolio').select('*').eq('user_id', userId).maybeSingle();
      if (!simPort) {
        simPort = { user_id: userId, cash_balance: 500, total_value: 500, ai_score: 1000, trading_mode: 'AUTO' };
        await supabase.from('simulation_portfolio').upsert(simPort);
      }

      let cash = Number(simPort.cash_balance);
      const { data: currentPositions } = await supabase.from('simulation_positions').select('ticker').eq('user_id', userId);
      const owned = new Set((currentPositions || []).map((p: any) => p.ticker));

      const topOpportunities = currentMarkets.filter(m => (m.aiColor === 'GREEN_DARK' || m.aiColor === 'GREEN_LIGHT') && !owned.has(m.ticker));
      const newPurchases: any[] = [];

      for (const target of topOpportunities) {
        if (cash < 20) break;

        const investAmount = Number(Math.min(cash >= 150 ? 70 : 45, cash).toFixed(2));
        if (investAmount < 15) break;

        const shares = Number((investAmount / target.price).toFixed(4));
        const stopLoss = Number((target.price * 0.93).toFixed(2));

        newPurchases.push({
          user_id: userId,
          ticker: target.ticker,
          company_name: target.name,
          shares,
          average_buy_price: target.price,
          current_price: target.price,
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
          : 'L’IA maintient ses positions gagnantes actuelles.'
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

    const dynamicMarkets = generateDynamicMarket();
    let manualPositions: any[] = [];
    let simulationPortfolio: any = { cash_balance: 500, total_value: 500 };
    let simulationPositions: any[] = [];

    if (userId) {
      const { data: mPos } = await supabase.from('manual_portfolio').select('*').eq('user_id', userId);
      manualPositions = (mPos || []).map((p: any) => {
        const live = dynamicMarkets.find(m => m.ticker === p.ticker);
        const curPrice = live ? live.price : Number(p.average_buy_price);
        const cost = Number((Number(p.shares) * Number(p.average_buy_price)).toFixed(2));
        const val = Number((Number(p.shares) * curPrice).toFixed(2));
        const pnl = Number((val - cost).toFixed(2));
        const pnlPct = cost > 0 ? Number(((pnl / cost) * 100).toFixed(2)) : 0;

        return {
          ...p,
          current_price: curPrice,
          current_value: val,
          cost_basis: cost,
          pnl,
          pnl_percent: pnlPct,
          history: live?.history,
          aiAdvice: live?.aiAdvice || 'Action sous surveillance continue.',
          aiSignal: live?.aiSignal || 'SURVEILLANCE',
          aiColor: live?.aiColor || 'YELLOW',
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

      const { data: sPort } = await supabase.from('simulation_portfolio').select('*').eq('user_id', userId).maybeSingle();
      if (sPort) simulationPortfolio = sPort;

      const { data: sPos } = await supabase.from('simulation_positions').select('*').eq('user_id', userId);
      let simVal = 0;
      simulationPositions = (sPos || []).map((p: any) => {
        const live = dynamicMarkets.find(m => m.ticker === p.ticker);
        const curPrice = live ? live.price : Number(p.current_price);
        const cost = Number((Number(p.shares) * Number(p.average_buy_price)).toFixed(2));
        const val = Number((Number(p.shares) * curPrice).toFixed(2));
        const pnl = Number((val - cost).toFixed(2));
        const pnlPct = cost > 0 ? Number(((pnl / cost) * 100).toFixed(2)) : 0;
        simVal += val;

        return {
          ...p,
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
      markets: dynamicMarkets,
      manualPositions,
      simulationPortfolio,
      simulationPositions
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
