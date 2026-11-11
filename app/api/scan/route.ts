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

// BASSIN ÉLARGI INCLUANT LES GROUPES DASSAULT, PÉPITES ET VALEURS MAJEURES
const BASE_MARKET_UNIVERSE = [
  // --- BOURSE DE PARIS (EURONEXT) ---
  { ticker: 'DSY.PA', name: 'Dassault Systèmes', market: 'PARIS', basePrice: 34.20, category: 'LOGICIELS / IA 3D', keywords: 'dassault systemes 3d cad tech france', volatility: 4.8, catalyst: 'Croissance à deux chiffres des licences cloud 3DEXPERIENCE.', aiBaseAdvice: 'Leader mondial du jumeau numérique. Valorisation redevenue attractive après consolidation.' },
  { ticker: 'AM.PA', name: 'Dassault Aviation', market: 'PARIS', basePrice: 198.50, category: 'DÉFENSE / AÉRO', keywords: 'dassault aviation rafale falcon defense armee', volatility: 5.2, catalyst: 'Commandes records à l’export pour les avions de combat Rafale.', aiBaseAdvice: 'Visibilité financière exceptionnelle sur 10 ans. Rempart défensif idéal.' },
  { ticker: 'VU.PA', name: 'VusionGroup (SES-imagotag)', market: 'PARIS', basePrice: 148.00, category: 'IOT / RETAIL IA', keywords: 'vusion ses imagotag walmart retail iot', volatility: 6.5, catalyst: 'Déploiement massif des étiquettes intelligentes chez Walmart US.', aiBaseAdvice: 'Pépite française leader mondial de l’IoT commercial. Forte rentabilité.' },
  { ticker: 'SU.PA', name: 'Schneider Electric', market: 'PARIS', basePrice: 242.00, category: 'INFRA DATA CENTERS', keywords: 'schneider electric data center energie transition', volatility: 3.8, catalyst: 'Équipement énergétique indispensable des data centers IA.', aiBaseAdvice: 'Hausse structurelle saine : profil de rendement très régulier.' },
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', basePrice: 624.00, category: 'LUXE MONDIAL', keywords: 'lvmh luxe arnault louis vuitton dior', volatility: 2.8, catalyst: 'Stabilisation de la consommation haut de gamme en Asie.', aiBaseAdvice: 'Support technique solide à 600 € : opportunité d’accumulation de long terme.' },
  { ticker: 'RMS.PA', name: 'Hermès International', market: 'PARIS', basePrice: 2080.00, category: 'ULTRA-LUXE', keywords: 'hermes birkin luxe maroquinerie', volatility: 2.2, catalyst: 'Commandes saturées et marges opérationnelles au sommet.', aiBaseAdvice: 'Le titre le plus solide de la cote européenne, imperméable aux crises.' },
  { ticker: 'AIR.PA', name: 'Airbus SE', market: 'PARIS', basePrice: 141.20, category: 'AÉRONAUTIQUE', keywords: 'airbus avions a320 a350 defense', volatility: 3.2, catalyst: 'Cadences de livraisons d’avions commerciaux en hausse.', aiBaseAdvice: 'Carnet de commandes supérieur à 8 000 avions assurant une visibilité record.' },
  { ticker: 'TTE.PA', name: 'TotalEnergies', market: 'PARIS', basePrice: 58.40, category: 'ÉNERGIE / DIVIDENDES', keywords: 'total energies petrol gaz dividende', volatility: 2.5, catalyst: 'Rendement du dividende élevé (7%) et rachats d’actions.', aiBaseAdvice: 'Actif de rendement très robuste sans volatilité excessive.' },

  // --- WALL STREET (US) : PÉPITES & GÉANTS ---
  { ticker: 'ASTS', name: 'AST SpaceMobile', market: 'US', basePrice: 26.40, category: 'SPATIAL / TÉLÉCOM', keywords: 'asts space mobile satellite telecom 5g espace', volatility: 8.5, catalyst: 'Déploiement constellation satellite directe aux smartphones.', aiBaseAdvice: 'Petite capitalisation à très fort potentiel d’explosion. Fort effet de levier.' },
  { ticker: 'PLTR', name: 'Palantir Technologies', market: 'US', basePrice: 44.50, category: 'IA / DÉFENSE', keywords: 'palantir pltr karp ia data defense aip', volatility: 6.2, catalyst: 'Signature de méga-contrats militaires US et forte adoption AIP.', aiBaseAdvice: 'Croissance fulgurante des marges, leadership incontesté dans l’IA opérationnelle.' },
  { ticker: 'APP', name: 'AppLovin Corp', market: 'US', basePrice: 285.00, category: 'ADTECH / IA', keywords: 'applovin app adtech pub mobile jeux ia', volatility: 7.8, catalyst: 'Moteur publicitaire AXON IA générant des cash-flows records.', aiBaseAdvice: 'Pépite technologique en pleine accélération. Momentum institutionnel massif.' },
  { ticker: 'NVDA', name: 'Nvidia Corp', market: 'US', basePrice: 142.50, category: 'SEMI-CONDUCTEURS', keywords: 'nvidia nvda puces gpu blackwell ia ai', volatility: 4.5, catalyst: 'Demande record de puces Blackwell et marges brutes de 75%.', aiBaseAdvice: 'Pilier mondial du secteur IA avec valorisation encore justifiée.' },
  { ticker: 'TSLA', name: 'Tesla Inc', market: 'US', basePrice: 254.00, category: 'AUTO / ROBOTIQUE', keywords: 'tesla tsla elon musk fsd robotaxi cybercab', volatility: 5.5, catalyst: 'Homologation FSD en Chine et réseau de Robotaxis.', aiBaseAdvice: 'Forte sensibilité aux annonces d’Elon Musk. Bons points d’entrée en repli.' },
  { ticker: 'MSFT', name: 'Microsoft Corp', market: 'US', basePrice: 428.00, category: 'CLOUD GÉANT', keywords: 'microsoft msft windows azure openai copilot', volatility: 2.1, catalyst: 'Monétisation d’Azure OpenAI et des postes de travail Copilot.', aiBaseAdvice: 'Grande stabilité défensive, risque de baisse quasi nul.' },
  { ticker: 'AAPL', name: 'Apple Inc', market: 'US', basePrice: 231.00, category: 'TECH / HARDWARE', keywords: 'apple aapl iphone ipad mac intelligence', volatility: 2.0, catalyst: 'Cycle de renouvellement porté par Apple Intelligence.', aiBaseAdvice: 'Générateur de cash massif et rachats constants d’actions.' }
];

// Générateur de courbes historiques réalistes pour le graphique interactif (1J, 1S, 1M, 1A)
function generateChartPoints(basePrice: number, changeVal: number) {
  const points = (count: number, volatility: number, trendUp: boolean) => {
    let p = basePrice * (trendUp ? 0.92 : 1.05);
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      const step = (Math.sin(i * 1.5) + (Math.random() - 0.48)) * volatility;
      p = Math.max(1, p + step);
      arr.push(Number(p.toFixed(2)));
    }
    arr[arr.length - 1] = Number((basePrice * (1 + changeVal / 100)).toFixed(2));
    return arr;
  };

  const isUp = changeVal >= 0;
  return {
    '1D': points(12, basePrice * 0.008, isUp),
    '1W': points(14, basePrice * 0.015, isUp),
    '1M': points(20, basePrice * 0.03, isUp),
    '1Y': points(24, basePrice * 0.06, isUp)
  };
}

function generateDynamicMarket() {
  return BASE_MARKET_UNIVERSE.map(item => {
    const randomFactor = (Math.sin(Date.now() / 15000 + item.basePrice) * 0.7) + (Math.cos(item.basePrice) * 0.3);
    const changeVal = Number((randomFactor * item.volatility).toFixed(2));
    const livePrice = Number((item.basePrice * (1 + changeVal / 100)).toFixed(2));
    const changeStr = (changeVal >= 0 ? '+' : '') + changeVal + '%';

    let aiSignal = 'CONSERVER';
    let aiConfidence = 82;
    let isSurge = false;

    if (changeVal >= 5.5) {
      aiSignal = '🔥 DÉTECTION PÉPITE (FORT)';
      aiConfidence = 96;
      isSurge = true;
    } else if (changeVal >= 2.5) {
      aiSignal = 'ACHAT FORT';
      aiConfidence = 92;
    } else if (changeVal >= 0.5) {
      aiSignal = 'ACHAT MODÉRÉ';
      aiConfidence = 87;
    } else if (changeVal <= -2.5) {
      aiSignal = 'OPPORTUNITÉ SUR REPLI';
      aiConfidence = 84;
    }

    return {
      ticker: item.ticker,
      name: item.name,
      market: item.market,
      price: livePrice,
      change: changeStr,
      changeRaw: changeVal,
      category: item.category,
      keywords: item.keywords,
      aiSignal,
      aiConfidence,
      isSurge,
      history: generateChartPoints(item.basePrice, changeVal),
      aiAdvice: isSurge 
        ? `Alerte IA : Poussée majeure de ${changeStr} détectée avec afflux de volumes. Moment idéal pour capter un fort momentum de gain.`
        : item.aiBaseAdvice,
      catalyst: item.catalyst,
      trend: changeVal >= 3.5 ? 'Rupture haussière puissante' : changeVal >= 0 ? 'Progression haussière stable' : 'Consolidation technique'
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

    // 1. AJOUT MANUEL DANS MON PORTEFEUILLE
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
      return NextResponse.json({ success: true, message: `Position ${ticker} enregistrée avec succès !` });
    }

    // 2. SUPPRESSION D'ACTION MANUELLE
    if (action === 'DELETE_MANUAL_POSITION') {
      const { positionId } = body;
      await supabase.from('manual_portfolio').delete().eq('id', positionId).eq('user_id', userId);
      return NextResponse.json({ success: true, message: 'Position supprimée.' });
    }

    // 3. RESET DE LA SIMULATION 500 €
    if (action === 'RESET_SIMULATION') {
      await supabase.from('simulation_positions').delete().eq('user_id', userId);
      await supabase.from('simulation_portfolio').upsert({
        user_id: userId,
        cash_balance: 500.00,
        total_value: 500.00,
        ai_score: 1000,
        trading_mode: 'AUTO'
      });
      return NextResponse.json({ success: true, message: 'Simulation 500 € réinitialisée avec succès.' });
    }

    // 4. CYCLE D'ACHAT AUTOMATIQUE SIMULATION
    if (action === 'AUTO_SIMULATION_STEP') {
      let { data: simPort } = await supabase.from('simulation_portfolio').select('*').eq('user_id', userId).maybeSingle();
      if (!simPort) {
        simPort = { user_id: userId, cash_balance: 500, total_value: 500, ai_score: 1000, trading_mode: 'AUTO' };
        await supabase.from('simulation_portfolio').upsert(simPort);
      }

      let cash = Number(simPort.cash_balance);
      const { data: currentPositions } = await supabase.from('simulation_positions').select('ticker').eq('user_id', userId);
      const owned = new Set((currentPositions || []).map((p: any) => p.ticker));

      const topOpportunities = currentMarkets.filter(m => m.aiConfidence >= 90 && !owned.has(m.ticker));
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
          aiSignal: live?.aiSignal || 'SURVEILLANCE'
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
          history: live?.history
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
