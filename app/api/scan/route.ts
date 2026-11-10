import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Données marchés avec prix de base d'achat simulé pour générer du gain/perte
const MARKETS_DATA = [
  { ticker: 'NVDA', name: 'Nvidia Corp', market: 'NASDAQ', price: 142.50, buyBase: 128.00, change: '+6.2%' },
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'EURONEXT', price: 624.00, buyBase: 610.00, change: '+2.3%' },
  { ticker: 'AAPL', name: 'Apple Inc', market: 'NASDAQ', price: 231.00, buyBase: 226.00, change: '+1.5%' },
  { ticker: 'TSLA', name: 'Tesla Inc', market: 'NASDAQ', price: 254.00, buyBase: 238.00, change: '+5.4%' },
  { ticker: 'TTE.PA', name: 'TotalEnergies', market: 'EURONEXT', price: 58.40, buyBase: 58.00, change: '+0.5%' }
];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'SCAN';

    // 1. Charger le portefeuille
    let { data: portfolio } = await supabase.from('portfolio').select('*').eq('id', 1).maybeSingle();
    if (!portfolio) {
      const { data: created } = await supabase.from('portfolio').insert({
        id: 1, initial_capital: 500, cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL'
      }).select().single();
      portfolio = created || { id: 1, cash_balance: 500, trading_mode: 'MANUAL', total_portfolio_value: 500 };
    }

    // ACTION : RESET (Remise à zéro 500€)
    if (action === 'RESET') {
      await supabase.from('positions').delete().neq('id', 0);
      await supabase.from('portfolio').update({ cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' }).eq('id', 1);
      portfolio.cash_balance = 500;
      portfolio.total_portfolio_value = 500;
      portfolio.trading_mode = 'MANUAL';
    }

    // ACTION : CHANGEMENT DE MODE
    if (action === 'SET_MODE') {
      const newMode = body.mode || 'MANUAL';
      await supabase.from('portfolio').update({ trading_mode: newMode }).eq('id', 1);
      portfolio.trading_mode = newMode;
    }

    // ACTION : VENTE MANUELLE
    if (action === 'SELL') {
      const { positionId } = body;
      const { data: pos } = await supabase.from('positions').select('*').eq('id', positionId).single();
      if (pos) {
        const live = MARKETS_DATA.find(m => m.ticker === pos.ticker);
        const curPrice = live ? live.price : pos.current_price;
        const totalSold = Number((Number(pos.shares) * curPrice).toFixed(2));
        const newCash = Number((Number(portfolio.cash_balance) + totalSold).toFixed(2));
        
        await supabase.from('positions').delete().eq('id', pos.id);
        await supabase.from('portfolio').update({ cash_balance: newCash }).eq('id', 1);
        portfolio.cash_balance = newCash;
      }
    }

    // 2. ANALYSES IA ET SIGNAUX
    await supabase.from('ai_analyses').delete().neq('id', 0);
    const analyses = [
      { 
        ticker: 'NVDA', 
        ai_name: 'Gemini (Fondamental)', 
        signal: 'STRONG_BUY', 
        confidence: 96, 
        momentum: 'EXPLOSIF',
        reasoning: 'Rupture haussière majeure. Carnet de commandes record, momentum maximal. Cible prioritaire pour accumuler des points.' 
      },
      { 
        ticker: 'TSLA', 
        ai_name: 'Groq / Llama (Technique)', 
        signal: 'STRONG_BUY', 
        confidence: 91, 
        momentum: 'TRÈS_FORT',
        reasoning: 'Volumes institutionnels massifs détectés. Cassure de résistance. Potentiel de gain très rapide.' 
      },
      { 
        ticker: 'MC.PA', 
        ai_name: 'Gemini (Fondamental)', 
        signal: 'BUY', 
        confidence: 84, 
        momentum: 'MODÉRÉ',
        reasoning: 'Bonne résilience défensive du luxe, croissance stable sans volatilité excessive.' 
      },
      { 
        ticker: 'AAPL', 
        ai_name: 'Groq / Llama (Technique)', 
        signal: 'BUY', 
        confidence: 80, 
        momentum: 'STABLE',
        reasoning: 'Flux réguliers, consolidation saine au-dessus de la moyenne mobile.' 
      }
    ];
    await supabase.from('ai_analyses').insert(analyses);

    // 3. MOTEUR IA : ARBITRAGE, CONSCIENCE ET OBJECTIF DE POINTS
    let logs: string[] = [];
    const isAuto = portfolio.trading_mode === 'AUTO' || (action === 'SET_MODE' && body.mode === 'AUTO');

    if (isAuto) {
      let { data: positions } = await supabase.from('positions').select('*');
      positions = positions || [];
      let cash = Number(portfolio.cash_balance);

      const topOpportunity = analyses.find(a => a.signal === 'STRONG_BUY' && a.confidence >= 90);

      // --- LOGIQUE D'ARBITRAGE POUR GAGNER DES POINTS ---
      // Si une opportunité explose (ex: NVDA ou TSLA) mais qu'on a moins de 50€ de cash :
      // L'IA vend une action plus lente/secondaire pour tout réallouer sur le leader !
      if (topOpportunity && cash < 50 && positions.length > 0) {
        const posToLiquidate = positions.find(p => p.ticker !== topOpportunity.ticker);
        if (posToLiquidate) {
          const mInfo = MARKETS_DATA.find(m => m.ticker === posToLiquidate.ticker);
          const pPrice = mInfo ? mInfo.price : posToLiquidate.current_price;
          const recoveredCash = Number((Number(posToLiquidate.shares) * pPrice).toFixed(2));
          
          await supabase.from('positions').delete().eq('id', posToLiquidate.id);
          cash = Number((cash + recoveredCash).toFixed(2));
          logs.push(`Arbitrage Points IA : Vente de ${posToLiquidate.ticker} (+${recoveredCash}€) pour surpondérer ${topOpportunity.ticker}`);
          
          positions = positions.filter(p => p.id !== posToLiquidate.id);
        }
      }

      // --- ACHATS STRATÉGIQUES IA ---
      for (const rec of analyses) {
        if (rec.signal !== 'BUY' && rec.signal !== 'STRONG_BUY') continue;
        if (cash < 15) break;

        const alreadyOwned = positions.some(p => p.ticker === rec.ticker);
        const market = MARKETS_DATA.find(m => m.ticker === rec.ticker);
        if (!market || alreadyOwned) continue;

        // Allocation agressive si confiance maximale
        let investAmount = 0;
        if (rec.confidence >= 92) {
          // Opportunité en or : peut investir jusqu'à 80% du cash restant ou la totalité si fin de portefeuille
          investAmount = cash > 200 ? Math.min(220, cash * 0.7) : cash;
        } else if (rec.confidence >= 85) {
          investAmount = Math.min(100, cash * 0.5);
        } else {
          investAmount = Math.min(50, cash * 0.3);
        }

        investAmount = Number(Math.max(15, Math.min(investAmount, cash)).toFixed(2));
        if (investAmount < 15) continue;

        const buyPrice = market.buyBase || market.price;
        const shares = Number((investAmount / buyPrice).toFixed(4));
        const stopLoss = Number((buyPrice * 0.94).toFixed(2));

        const { error: insErr } = await supabase.from('positions').insert({
          ticker: market.ticker,
          company_name: market.name,
          shares,
          average_buy_price: buyPrice,
          current_price: market.price,
          current_value: Number((shares * market.price).toFixed(2)),
          stop_loss_price: stopLoss
        });

        if (!insErr) {
          cash = Number((cash - investAmount).toFixed(2));
          logs.push(`Achat IA : ${market.ticker} (${investAmount}€ - Confiance ${rec.confidence}%)`);
        }
      }

      await supabase.from('portfolio').update({ cash_balance: cash }).eq('id', 1);
      portfolio.cash_balance = cash;
    }

    // 4. RÉCUPÉRATION FINALE DES POSITIONS ET COURS EN DIRECT
    const { data: updatedPos } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
    
    let totalInvested = 0;
    let totalPositionsVal = 0;

    const formattedPositions = (updatedPos || []).map((p: any) => {
      const live = MARKETS_DATA.find(m => m.ticker === p.ticker);
      const curPrice = live ? live.price : Number(p.current_price);
      const buyPrice = Number(p.average_buy_price);
      const shares = Number(p.shares);
      
      const cost = Number((shares * buyPrice).toFixed(2));
      const curVal = Number((shares * curPrice).toFixed(2));
      const pnl = Number((curVal - cost).toFixed(2));
      const pnlPct = cost > 0 ? Number(((pnl / cost) * 100).toFixed(2)) : 0;

      totalInvested += cost;
      totalPositionsVal += curVal;

      return {
        ...p,
        current_price: curPrice,
        current_value: curVal,
        cost_basis: cost,
        pnl,
        pnl_percent: pnlPct
      };
    });

    const totalPortfolioVal = Number((Number(portfolio.cash_balance) + totalPositionsVal).toFixed(2));
    await supabase.from('portfolio').update({ total_portfolio_value: totalPortfolioVal }).eq('id', 1);
    portfolio.total_portfolio_value = totalPortfolioVal;

    // Calcul du score IA (Base 1 000 pts + 25 pts par euro de profit gagné)
    const netGains = totalPortfolioVal - 500;
    const aiScore = Math.max(0, Math.round(1000 + (netGains * 25)));

    return NextResponse.json({
      success: true,
      message: logs.length > 0 ? logs.join(' | ') : 'Analyses synchronisées. Stratégie optimisée.',
      portfolio,
      positions: formattedPositions,
      analyses,
      markets: MARKETS_DATA,
      ai_score: aiScore
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabase();
    let { data: portfolio } = await supabase.from('portfolio').select('*').eq('id', 1).maybeSingle();
    const { data: rawPos } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
    const { data: analyses } = await supabase.from('ai_analyses').select('*').order('confidence', { ascending: false });

    let totalPositionsVal = 0;
    const positions = (rawPos || []).map((p: any) => {
      const live = MARKETS_DATA.find(m => m.ticker === p.ticker);
      const curPrice = live ? live.price : Number(p.current_price);
      const buyPrice = Number(p.average_buy_price);
      const shares = Number(p.shares);

      const cost = Number((shares * buyPrice).toFixed(2));
      const curVal = Number((shares * curPrice).toFixed(2));
      const pnl = Number((curVal - cost).toFixed(2));
      const pnlPct = cost > 0 ? Number(((pnl / cost) * 100).toFixed(2)) : 0;

      totalPositionsVal += curVal;

      return {
        ...p,
        current_price: curPrice,
        current_value: curVal,
        cost_basis: cost,
        pnl,
        pnl_percent: pnlPct
      };
    });

    const cash = portfolio ? Number(portfolio.cash_balance) : 500;
    const totalVal = Number((cash + totalPositionsVal).toFixed(2));
    const netGains = totalVal - 500;
    const aiScore = Math.max(0, Math.round(1000 + (netGains * 25)));

    if (portfolio) {
      portfolio.total_portfolio_value = totalVal;
    }

    return NextResponse.json({
      portfolio: portfolio || { cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' },
      positions,
      analyses: analyses || [],
      markets: MARKETS_DATA,
      ai_score: aiScore
    });
  } catch (err: any) {
    return NextResponse.json({
      portfolio: { cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' },
      positions: [],
      analyses: [],
      markets: MARKETS_DATA,
      ai_score: 1000
    });
  }
}
