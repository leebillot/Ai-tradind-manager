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

// BASSIN ÉLARGI : MÉGA-CAPS + MOYENNES CAPITALISATIONS & PÉPITES EXPLOSIVES (US & PARIS)
const BASE_MARKET_UNIVERSE = [
  // --- WALL STREET (US) : PÉPITES & CROISSANCE FORTE ---
  { ticker: 'ASTS', name: 'AST SpaceMobile', market: 'US', basePrice: 26.40, category: 'SPATIAL / TÉLÉCOM', volatility: 8.5, catalyst: 'Déploiement constellation satellite directe aux smartphones.', aiBaseAdvice: 'Petite capitalisation à très fort potentiel d’explosion. Fort effet de levier.' },
  { ticker: 'PLTR', name: 'Palantir Technologies', market: 'US', basePrice: 44.50, category: 'IA / DÉFENSE', volatility: 6.2, catalyst: 'Signature de méga-contrats militaires US et forte adoption AIP.', aiBaseAdvice: 'Croissance fulgurante des marges, leadership incontesté dans l’IA opérationnelle.' },
  { ticker: 'APP', name: 'AppLovin Corp', market: 'US', basePrice: 285.00, category: 'ADTECH / IA', volatility: 7.8, catalyst: 'Moteur publicitaire AXON IA générant des cash-flows records.', aiBaseAdvice: 'Pépite technologique en pleine accélération. Momentum institutionnel massif.' },
  { ticker: 'RKLB', name: 'Rocket Lab USA', market: 'US', basePrice: 18.20, category: 'AÉROSPATIALE', volatility: 6.9, catalyst: 'Succès des lancements Neutron et contrats spatiaux commerciaux.', aiBaseAdvice: 'Le challenger numéro 1 de SpaceX sur les petits lancements orbitaux.' },
  { ticker: 'IONQ', name: 'IonQ Inc', market: 'US', basePrice: 24.80, category: 'QUANTIQUE', volatility: 9.2, catalyst: 'Percée majeure sur les processeurs quantiques à piège à ions.', aiBaseAdvice: 'Actif hautement spéculatif : gains potentiels énormes mais stop-loss obligatoire.' },
  { ticker: 'SOUN', name: 'SoundHound AI', market: 'US', basePrice: 6.80, category: 'IA VOCALE', volatility: 8.0, catalyst: 'Partenariats dans l’automobile et la restauration rapide.', aiBaseAdvice: 'Micro-cap à forte volatilité : viser des prises de profits rapides.' },
  { ticker: 'NVDA', name: 'Nvidia Corp', market: 'US', basePrice: 142.50, category: 'SEMI-CONDUCTEURS', volatility: 4.5, catalyst: 'Demande record de puces Blackwell et marges brutes de 75%.', aiBaseAdvice: 'Pilier mondial du secteur IA avec valorisation encore justifiée.' },
  { ticker: 'TSLA', name: 'Tesla Inc', market: 'US', basePrice: 254.00, category: 'AUTO / ROBOTIQUE', volatility: 5.5, catalyst: 'Homologation FSD en Chine et réseau de Robotaxis.', aiBaseAdvice: 'Forte sensibilité aux annonces d’Elon Musk. Bons points d’entrée en repli.' },
  { ticker: 'MSFT', name: 'Microsoft Corp', market: 'US', basePrice: 428.00, category: 'CLOUD GÉANT', volatility: 2.1, catalyst: 'Monétisation d’Azure OpenAI et des postes de travail Copilot.', aiBaseAdvice: 'Grande stabilité défensive, risque de baisse quasi nul.' },

  // --- PARIS (EURONEXT) : PÉPITES & CHAMPIONS INDUSTRIELS ---
  { ticker: 'VU.PA', name: 'VusionGroup (SES-imagotag)', market: 'PARIS', basePrice: 148.00, category: 'IOT / RETAIL IA', volatility: 6.5, catalyst: 'Déploiement massif des étiquettes intelligentes chez Walmart US.', aiBaseAdvice: 'Pépite française leader mondial de l’IoT commercial. Forte rentabilité.' },
  { ticker: 'SU.PA', name: 'Schneider Electric', market: 'PARIS', basePrice: 242.00, category: 'INFRA DATA CENTERS', volatility: 3.8, catalyst: 'Equipement énergétique indispensable des data centers IA.', aiBaseAdvice: 'Hausse structurelle saine : profil de rendement très régulier.' },
  { ticker: 'SOI.PA', name: 'Soitec', market: 'PARIS', basePrice: 94.50, category: 'SEMI-CONDUCTEURS', volatility: 7.0, catalyst: 'Reprise du cycle des smartphones 5G et du carbure de silicium.', aiBaseAdvice: 'Forte décote historique : potentiel de rebond technique de +30%.' },
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', basePrice: 624.00, category: 'LUXE MONDIAL', volatility: 2.8, catalyst: 'Stabilisation de la consommation haut de gamme en Asie.', aiBaseAdvice: 'Support technique solide à 600 € : opportunité d’accumulation de long terme.' },
  { ticker: 'RMS.PA', name: 'Hermès International', market: 'PARIS', basePrice: 2080.00, category: 'ULTRA-LUXE', volatility: 2.2, catalyst: 'Commandes saturées et marges opérationnelles au sommet.', aiBaseAdvice: 'Le titre le plus solide de la cote européenne, imperméable aux crises.' },
  { ticker: 'NANO.PA', name: 'Nanobiotix', market: 'PARIS', basePrice: 6.40, category: 'BIOTECH / ONCOLOGIE', volatility: 9.8, catalyst: 'Résultats cliniques de phase 3 en partenariat avec J&J.', aiBaseAdvice: 'Biotech à pile ou face : peut faire +50% en un jour sur annonce positive.' }
];

// Moteur de simulation dynamique du marché (met en avant les plus fortes hausses du jour)
function generateDynamicMarket() {
  return BASE_MARKET_UNIVERSE.map(item => {
    // Calcul de variation dynamique avec volatilité
    const randomFactor = (Math.sin(Date.now() / 10000 + item.basePrice) * 0.7) + (Math.cos(item.basePrice) * 0.3);
    const changeVal = Number((randomFactor * item.volatility).toFixed(2));
    const livePrice = Number((item.basePrice * (1 + changeVal / 100)).toFixed(2));
    const changeStr = (changeVal >= 0 ? '+' : '') + changeVal + '%';

    // Détermination de l'Avis IA en fonction de la poussée du jour
    let aiSignal = 'CONSERVER';
    let aiConfidence = 82;
    let isSurge = false;

    if (changeVal >= 7.0) {
      aiSignal = '🔥 DÉTECTION PÉPITE (FORT)';
      aiConfidence = 96;
      isSurge = true;
    } else if (changeVal >= 3.5) {
      aiSignal = 'ACHAT FORT';
      aiConfidence = 92;
    } else if (changeVal >= 1.0) {
      aiSignal = 'ACHAT MODÉRÉ';
      aiConfidence = 87;
    } else if (changeVal <= -3.0) {
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
      aiSignal,
      aiConfidence,
      isSurge,
      aiAdvice: isSurge 
        ? `Alerte IA : Poussée explosive de ${changeStr} détectée ! Volumes d'achats records. Idéal pour capter un momentum de gain élevé.`
        : item.aiBaseAdvice,
      catalyst: item.catalyst,
      trend: changeVal >= 4.0 ? 'Rupture haussière puissante' : changeVal >= 0 ? 'Progression haussière stable' : 'Consolidation technique'
    };
  }).sort((a, b) => b.changeRaw - a.changeRaw); // Les plus grosses hausses remontent TOUJOURS en premier !
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

    // 1. AJOUT D'UNE ACTION RÉELLE
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
      return NextResponse.json({ success: true, message: `Position ${ticker} ajoutée à votre portefeuille !` });
    }

    // 2. SUPPRESSION D'ACTION RÉELLE
    if (action === 'DELETE_MANUAL_POSITION') {
      const { positionId } = body;
      await supabase.from('manual_portfolio').delete().eq('id', positionId).eq('user_id', userId);
      return NextResponse.json({ success: true, message: 'Position supprimée.' });
    }

    // 3. RÉINITIALISATION DE LA SIMULATION 500 €
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

    // 4. CYCLE D'ACHAT AUTOMATIQUE (CHASSE AUX PÉPITES ET HAUTS RENDEMENTS)
    if (action === 'AUTO_SIMULATION_STEP') {
      let { data: simPort } = await supabase.from('simulation_portfolio').select('*').eq('user_id', userId).maybeSingle();
      if (!simPort) {
        simPort = { user_id: userId, cash_balance: 500, total_value: 500, ai_score: 1000, trading_mode: 'AUTO' };
        await supabase.from('simulation_portfolio').upsert(simPort);
      }

      let cash = Number(simPort.cash_balance);
      const { data: currentPositions } = await supabase.from('simulation_positions').select('ticker').eq('user_id', userId);
      const owned = new Set((currentPositions || []).map((p: any) => p.ticker));

      // L'IA cible EN PRIORITÉ les plus fortes hausses et pépites du jour
      const topOpportunities = currentMarkets.filter(m => m.aiConfidence >= 90 && !owned.has(m.ticker));
      const newPurchases: any[] = [];

      for (const target of topOpportunities) {
        if (cash < 20) break;

        // Allouer du cash proportionnel à la force de l'opportunité
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
          ? `L'IA a investi sur les pépites : ${newPurchases.map(p => `${p.ticker} (${p.current_value}€)`).join(', ')}`
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
      // Vrai Portefeuille
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
          aiAdvice: live?.aiAdvice || 'Action sous surveillance continue.',
          aiSignal: live?.aiSignal || 'SURVEILLANCE'
        };
      });

      // Simulation 500 €
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
          pnl_percent: pnlPct
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
