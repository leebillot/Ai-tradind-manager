import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

// Nettoyeur automatique pour réparer l'erreur "Invalid path specified in request URL"
function getSupabase() {
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  // Supprime les guillemets accidentels et les slashs de fin
  rawUrl = rawUrl.replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  
  try {
    const parsed = new URL(rawUrl);
    rawUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    // Garde le format brut nettoyé
  }

  let rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  rawKey = rawKey.replace(/^["']|["']$/g, '');

  return createClient(rawUrl, rawKey);
}

const MARKETS_DATA = [
  { ticker: 'PLTR', name: 'Palantir Tech', market: 'NYSE', price: 44.50, buyBase: 38.50, change: '+8.3%' },
  { ticker: 'NVDA', name: 'Nvidia Corp', market: 'NASDAQ', price: 142.50, buyBase: 130.00, change: '+5.4%' },
  { ticker: 'TSLA', name: 'Tesla Inc', market: 'NASDAQ', price: 254.00, buyBase: 235.00, change: '+6.2%' },
  { ticker: 'SU.PA', name: 'Schneider Electric', market: 'PARIS', price: 242.00, buyBase: 231.00, change: '+3.8%' },
  { ticker: 'MSFT', name: 'Microsoft Corp', market: 'NASDAQ', price: 428.00, buyBase: 416.00, change: '+1.9%' },
  { ticker: 'RMS.PA', name: 'Hermès Intl', market: 'PARIS', price: 2080.00, buyBase: 2010.00, change: '+2.9%' },
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', price: 624.00, buyBase: 608.00, change: '+2.1%' },
  { ticker: 'AAPL', name: 'Apple Inc', market: 'NASDAQ', price: 231.00, buyBase: 226.00, change: '+1.2%' },
  { ticker: 'AMZN', name: 'Amazon.com', market: 'NASDAQ', price: 196.00, buyBase: 188.00, change: '+2.5%' },
  { ticker: 'AIR.PA', name: 'Airbus SE', market: 'PARIS', price: 141.20, buyBase: 137.00, change: '+1.4%' },
  { ticker: 'TTE.PA', name: 'TotalEnergies', market: 'PARIS', price: 58.40, buyBase: 57.50, change: '+0.9%' },
  { ticker: 'LLY', name: 'Eli Lilly', market: 'NYSE', price: 820.00, buyBase: 790.00, change: '+2.8%' }
];

function formatPositions(rawPositions: any[]) {
  let totalPositionsVal = 0;
  let totalInvested = 0;

  const positions = (rawPositions || []).map((p: any) => {
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

  return { positions, totalPositionsVal, totalInvested };
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'SCAN';

    // 1. Récupération ou initialisation du portefeuille
    let { data: portfolio } = await supabase.from('portfolio').select('*').eq('id', 1).maybeSingle();
    if (!portfolio) {
      const { data: created } = await supabase.from('portfolio').insert({
        id: 1, initial_capital: 500, cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL'
      }).select().single();
      portfolio = created || { id: 1, cash_balance: 500, trading_mode: 'MANUAL', total_portfolio_value: 500 };
    }

    let currentMode = body.mode !== undefined ? body.mode : (portfolio.trading_mode || 'MANUAL');

    // ==========================================
    // ACTION : ACHAT MANUEL
    // ==========================================
    if (action === 'MANUAL_BUY') {
      const { ticker, name, price, amount } = body;
      const spend = Number(amount || 40);
      let curCash = Number(portfolio.cash_balance);

      if (curCash < spend) {
        return NextResponse.json({ error: 'Fonds insuffisants en cash disponible.' }, { status: 400 });
      }

      const shares = Number((spend / price).toFixed(4));
      const stopLoss = Number((price * 0.94).toFixed(2));

      // Insertion avec .select() pour forcer la confirmation en base
      const { error: insErr } = await supabase.from('positions').insert({
        ticker,
        company_name: name,
        shares,
        average_buy_price: price,
        current_price: price,
        current_value: spend,
        stop_loss_price: stopLoss
      }).select();

      if (insErr) {
        return NextResponse.json({ error: 'Erreur insertion Supabase: ' + insErr.message }, { status: 500 });
      }

      curCash = Number((curCash - spend).toFixed(2));
      const { data: allPos } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
      const { positions, totalPositionsVal } = formatPositions(allPos || []);
      const totalVal = Number((curCash + totalPositionsVal).toFixed(2));

      await supabase.from('portfolio').update({ cash_balance: curCash, total_portfolio_value: totalVal }).eq('id', 1);
      portfolio.cash_balance = curCash;
      portfolio.total_portfolio_value = totalVal;

      return NextResponse.json({
        success: true,
        message: `Achat confirmé : ${ticker} (+${spend} €)`,
        portfolio,
        positions,
        markets: MARKETS_DATA
      });
    }

    // ==========================================
    // ACTION : VENTE
    // ==========================================
    if (action === 'SELL') {
      const { positionId } = body;
      const { data: pos } = await supabase.from('positions').select('*').eq('id', positionId).single();
      if (pos) {
        const live = MARKETS_DATA.find(m => m.ticker === pos.ticker);
        const curPrice = live ? live.price : Number(pos.current_price);
        const refund = Number((Number(pos.shares) * curPrice).toFixed(2));
        const newCash = Number((Number(portfolio.cash_balance) + refund).toFixed(2));

        await supabase.from('positions').delete().eq('id', pos.id);

        const { data: allPos } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
        const { positions, totalPositionsVal } = formatPositions(allPos || []);
        const totalVal = Number((newCash + totalPositionsVal).toFixed(2));

        await supabase.from('portfolio').update({ cash_balance: newCash, total_portfolio_value: totalVal }).eq('id', 1);
        portfolio.cash_balance = newCash;
        portfolio.total_portfolio_value = totalVal;

        return NextResponse.json({
          success: true,
          message: `Position ${pos.ticker} clôturée (+${refund} €)`,
          portfolio,
          positions,
          markets: MARKETS_DATA
        });
      }
    }

    // ==========================================
    // ACTION : RESET (500€)
    // ==========================================
    if (action === 'RESET') {
      await supabase.from('positions').delete().neq('id', 0);
      await supabase.from('portfolio').update({ cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' }).eq('id', 1);
      return NextResponse.json({
        success: true,
        message: 'Portefeuille réinitialisé avec 500 € !',
        portfolio: { cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' },
        positions: [],
        markets: MARKETS_DATA,
        ai_score: 1000
      });
    }

    // ==========================================
    // ACTION : SET_MODE OU SCAN
    // ==========================================
    if (action === 'SET_MODE') {
      currentMode = body.mode || 'MANUAL';
      await supabase.from('portfolio').update({ trading_mode: currentMode }).eq('id', 1);
      portfolio.trading_mode = currentMode;
    }

    // Recommandations IA
    await supabase.from('ai_analyses').delete().neq('id', 0);
    const poolAnalyses = [
      { ticker: 'PLTR', ai_name: 'Groq / Llama (Momentum)', signal: 'STRONG_BUY', confidence: 98, reasoning: 'Contrats IA massifs, accélération de la demande en défense.' },
      { ticker: 'NVDA', ai_name: 'Gemini (Fondamental)', signal: 'STRONG_BUY', confidence: 95, reasoning: 'Leadership incontesté sur les puces Blackwell avec 75% de marge.' },
      { ticker: 'SU.PA', ai_name: 'Gemini (Fondamental)', signal: 'STRONG_BUY', confidence: 92, reasoning: 'Infrastructure énergétique critique pour les data centers mondiaux.' },
      { ticker: 'TSLA', ai_name: 'Groq / Llama (Technique)', signal: 'STRONG_BUY', confidence: 91, reasoning: 'Cassure technique haussière confirmée par de gros volumes.' },
      { ticker: 'RMS.PA', ai_name: 'Gemini (Fondamental)', signal: 'BUY', confidence: 89, reasoning: 'Modèle ultra-luxe résistant sans stocks excédentaires.' },
      { ticker: 'MSFT', ai_name: 'Groq / Llama (Technique)', signal: 'BUY', confidence: 87, reasoning: 'Monétisation solide de la suite Copilot entreprise.' }
    ];
    await supabase.from('ai_analyses').insert(poolAnalyses);

    // MODE AUTO : Achats réels immédiats et garantis
    let autoLog = '';
    if (currentMode === 'AUTO') {
      const { data: currentPos } = await supabase.from('positions').select('ticker');
      const ownedTickers = new Set((currentPos || []).map((p: any) => p.ticker));
      let availableCash = Number(portfolio.cash_balance);

      const toBuyList: any[] = [];
      const targets = poolAnalyses.filter(a => a.confidence >= 90 && !ownedTickers.has(a.ticker));

      for (const target of targets) {
        if (availableCash < 25) break;
        const market = MARKETS_DATA.find(m => m.ticker === target.ticker);
        if (!market) continue;

        const investAmount = Number(Math.min(availableCash >= 150 ? 70 : 40, availableCash).toFixed(2));
        if (investAmount < 20) break;

        const buyPrice = market.buyBase || market.price;
        const shares = Number((investAmount / buyPrice).toFixed(4));
        const stopLoss = Number((buyPrice * 0.94).toFixed(2));

        toBuyList.push({
          ticker: market.ticker,
          company_name: market.name,
          shares,
          average_buy_price: buyPrice,
          current_price: market.price,
          current_value: investAmount,
          stop_loss_price: stopLoss
        });

        availableCash = Number((availableCash - investAmount).toFixed(2));
      }

      if (toBuyList.length > 0) {
        // Insertion réelle avec confirmation .select()
        const { error: batchErr } = await supabase.from('positions').insert(toBuyList).select();
        if (!batchErr) {
          await supabase.from('portfolio').update({ cash_balance: availableCash }).eq('id', 1);
          portfolio.cash_balance = availableCash;
          autoLog = `L'IA a acquis : ${toBuyList.map(t => `${t.ticker} (${t.current_value}€)`).join(', ')}`;
        }
      }
    }

    // Récupération actualisée
    const { data: allPos } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
    const { positions, totalPositionsVal } = formatPositions(allPos || []);
    const finalTotalVal = Number((Number(portfolio.cash_balance) + totalPositionsVal).toFixed(2));

    await supabase.from('portfolio').update({ 
      total_portfolio_value: finalTotalVal,
      trading_mode: currentMode 
    }).eq('id', 1);

    portfolio.total_portfolio_value = finalTotalVal;
    portfolio.trading_mode = currentMode;

    const netGains = finalTotalVal - 500;
    const aiScore = Math.max(0, Math.round(1000 + (netGains * 25)));

    return NextResponse.json({
      success: true,
      message: autoLog || (currentMode === 'AUTO' ? 'Mode AUTO : Portefeuille sous gestion active.' : 'Scan terminé : Données actualisées.'),
      portfolio,
      positions,
      analyses: poolAnalyses,
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

    const { positions, totalPositionsVal } = formatPositions(rawPos || []);
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
