import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Données du marché
const MARKETS_DATA = [
  { ticker: 'NVDA', name: 'Nvidia Corp', market: 'US', price: 138.50, change: '+2.4%' },
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', price: 618.50, change: '+1.2%' },
  { ticker: 'AAPL', name: 'Apple Inc', market: 'US', price: 228.00, change: '+0.5%' },
  { ticker: 'TSLA', name: 'Tesla Inc', market: 'US', price: 248.00, change: '+3.1%' },
  { ticker: 'TTE.PA', name: 'TotalEnergies', market: 'PARIS', price: 58.20, change: '+0.8%' },
  { ticker: 'AIR.PA', name: 'Airbus SE', market: 'PARIS', price: 139.40, change: '-0.4%' }
];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'SCAN';

    // 1. Récupération du portefeuille en base
    let { data: portfolio } = await supabase.from('portfolio').select('*').eq('id', 1).maybeSingle();
    
    if (!portfolio) {
      const { data: created } = await supabase.from('portfolio').insert({
        id: 1,
        initial_capital: 500,
        cash_balance: 500,
        total_portfolio_value: 500,
        trading_mode: 'MANUAL'
      }).select().single();
      portfolio = created || { id: 1, cash_balance: 500, trading_mode: 'MANUAL', total_portfolio_value: 500 };
    }

    // ACTION : Réinitialiser (Reset) le compte à 500€
    if (action === 'RESET') {
      await supabase.from('positions').delete().neq('id', 0);
      await supabase.from('portfolio').update({
        cash_balance: 500,
        total_portfolio_value: 500,
        trading_mode: 'MANUAL'
      }).eq('id', 1);

      return NextResponse.json({ success: true, message: 'Portefeuille réinitialisé avec 500 € !' });
    }

    // ACTION : Changement de Mode (MANUAL <-> AUTO)
    let currentMode = portfolio.trading_mode;
    if (action === 'SET_MODE') {
      currentMode = body.mode || 'MANUAL';
      await supabase.from('portfolio').update({ trading_mode: currentMode }).eq('id', 1);
      portfolio.trading_mode = currentMode;
    }

    // ACTION : Achat manuel
    if (action === 'MANUAL_BUY') {
      const { ticker, name, price } = body;
      const invest = Math.min(100, Number(portfolio.cash_balance));
      if (invest < 10) return NextResponse.json({ error: 'Fonds disponibles insuffisants' }, { status: 400 });

      const shares = Number((invest / price).toFixed(4));
      const stopLoss = Number((price * 0.95).toFixed(2));

      await supabase.from('positions').insert({
        ticker,
        company_name: name,
        shares,
        average_buy_price: price,
        current_price: price,
        current_value: invest,
        stop_loss_price: stopLoss
      });

      const newCash = Number((portfolio.cash_balance - invest).toFixed(2));
      await supabase.from('portfolio').update({ cash_balance: newCash }).eq('id', 1);
      return NextResponse.json({ success: true, message: `Achat de ${invest}€ sur ${ticker} confirmé !` });
    }

    // ACTION : Vente manuelle
    if (action === 'SELL') {
      const { positionId } = body;
      const { data: pos } = await supabase.from('positions').select('*').eq('id', positionId).single();
      if (pos) {
        const newCash = Number((Number(portfolio.cash_balance) + Number(pos.current_value)).toFixed(2));
        await supabase.from('positions').delete().eq('id', pos.id);
        await supabase.from('portfolio').update({ cash_balance: newCash }).eq('id', 1);
        return NextResponse.json({ success: true, message: `Position ${pos.ticker} vendue (+${pos.current_value}€) !` });
      }
    }

    // 2. ANALYSE ET SIGNAUX DE L'IA (Mise à jour dans tous les cas)
    await supabase.from('ai_analyses').delete().neq('id', 0);
    const analyses = [
      { ticker: 'NVDA', ai_name: 'Gemini (Fondamental)', signal: 'BUY', confidence: 92, reasoning: 'Dominance totale des puces IA, carnet plein, marges records.' },
      { ticker: 'NVDA', ai_name: 'Groq / Llama (Technique)', signal: 'BUY', confidence: 87, reasoning: 'Rebond confirmé sur support, volumes acheteurs très puissants.' },
      { ticker: 'MC.PA', ai_name: 'Gemini (Fondamental)', signal: 'BUY', confidence: 85, reasoning: 'Position de luxe ultra-solide, valorisation redevenue attractive.' },
      { ticker: 'AAPL', ai_name: 'Groq / Llama (Technique)', signal: 'BUY', confidence: 83, reasoning: 'Cassure technique haussière avec flux institutionnels.' },
      { ticker: 'TSLA', ai_name: 'Gemini (Fondamental)', signal: 'BUY', confidence: 79, reasoning: 'Accélération des déploiements FSD et stockage énergétique.' }
    ];
    await supabase.from('ai_analyses').insert(analyses);

    // 3. EXÉCUTION DU TRADING AUTOMATIQUE PAR L'IA
    // L'IA achète si le mode est AUTO ou si on vient de basculer en AUTO
    let tradesExecuted: string[] = [];

    if (currentMode === 'AUTO' || body.mode === 'AUTO' || action === 'AUTO') {
      // Actions que l'on possède déjà
      const { data: existingPositions } = await supabase.from('positions').select('ticker');
      const owned = new Set((existingPositions || []).map((p: any) => p.ticker));

      let availableCash = Number(portfolio.cash_balance);

      // On classe les actions recommandées par confiance
      const candidates = [
        { ticker: 'NVDA', name: 'Nvidia Corp', price: 138.50, confidence: 92 },
        { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', price: 618.50, confidence: 85 },
        { ticker: 'AAPL', name: 'Apple Inc', price: 228.00, confidence: 83 }
      ];

      for (const item of candidates) {
        // Si on a déjà l'action ou s'il reste moins de 25€, on passe
        if (owned.has(item.ticker) || availableCash < 25) continue;

        // Montant alloué par action (jusqu'à 100€ selon le cash restant)
        const investAmount = Math.min(100, availableCash);
        const shares = Number((investAmount / item.price).toFixed(4));
        const stopLoss = Number((item.price * 0.95).toFixed(2));

        // Enregistrement de l'achat automatique
        await supabase.from('positions').insert({
          ticker: item.ticker,
          company_name: item.name,
          shares,
          average_buy_price: item.price,
          current_price: item.price,
          current_value: investAmount,
          stop_loss_price: stopLoss
        });

        availableCash = Number((availableCash - investAmount).toFixed(2));
        owned.add(item.ticker);
        tradesExecuted.push(`${item.ticker} (${investAmount}€)`);
      }

      // Mise à jour finale du solde restant dans Supabase
      if (tradesExecuted.length > 0) {
        await supabase.from('portfolio').update({ cash_balance: availableCash }).eq('id', 1);
        portfolio.cash_balance = availableCash;
      }
    }

    const message = tradesExecuted.length > 0
      ? `Mode AUTO activé : L'IA a acheté ${tradesExecuted.join(', ')} !`
      : currentMode === 'AUTO'
        ? 'Mode AUTO : Toutes les positions cibles sont déjà ouvertes ou fonds insuffisants.'
        : 'Mode Manuel actif : Avis IA mis à jour.';

    return NextResponse.json({
      success: true,
      message,
      mode: currentMode,
      trades: tradesExecuted
    });

  } catch (err: any) {
    console.error('Erreur POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // 1. Portefeuille
    let { data: portfolio } = await supabase.from('portfolio').select('*').eq('id', 1).maybeSingle();
    
    // 2. Positions
    const { data: positions } = await supabase.from('positions').select('*').order('created_at', { ascending: false });

    // 3. Calcul de la valeur réelle totale
    const positionsValue = (positions || []).reduce((sum: number, p: any) => sum + Number(p.current_value || 0), 0);
    const cash = portfolio ? Number(portfolio.cash_balance) : 500;
    const totalVal = Number((cash + positionsValue).toFixed(2));

    if (portfolio) {
      await supabase.from('portfolio').update({ total_portfolio_value: totalVal }).eq('id', 1);
      portfolio.total_portfolio_value = totalVal;
    }

    // 4. Analyses IA
    const { data: analyses } = await supabase.from('ai_analyses').select('*').order('confidence', { ascending: false });

    return NextResponse.json({
      portfolio: portfolio || { cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' },
      positions: positions || [],
      analyses: analyses || [],
      markets: MARKETS_DATA
    });
  } catch (err: any) {
    return NextResponse.json({
      portfolio: { cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' },
      positions: [],
      analyses: [],
      markets: MARKETS_DATA
    });
  }
}
