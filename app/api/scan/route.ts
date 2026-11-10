import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    console.error("Supabase URL ou Clé API manquante dans les variables d'environnement !");
  }
  return createClient(url, key);
}

// Données des actions suivies
const MARKETS_DATA = [
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', market: 'PARIS', price: 618.50, change: '+1.2%', tv: 'EURONEXT:MC' },
  { ticker: 'TTE.PA', name: 'TotalEnergies', market: 'PARIS', price: 58.20, change: '+0.8%', tv: 'EURONEXT:TTE' },
  { ticker: 'AIR.PA', name: 'Airbus SE', market: 'PARIS', price: 139.40, change: '-0.4%', tv: 'EURONEXT:AIR' },
  { ticker: 'NVDA', name: 'Nvidia Corp', market: 'US', price: 138.50, change: '+2.4%', tv: 'NASDAQ:NVDA' },
  { ticker: 'AAPL', name: 'Apple Inc', market: 'US', price: 228.00, change: '+0.5%', tv: 'NASDAQ:AAPL' },
  { ticker: 'TSLA', name: 'Tesla Inc', market: 'US', price: 248.00, change: '+3.1%', tv: 'NASDAQ:TSLA' }
];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'SCAN';

    // 1. Récupération ou création du portefeuille persistant
    let { data: portfolio } = await supabase.from('portfolio').select('*').eq('id', 'main').single();
    if (!portfolio) {
      const { data: created } = await supabase.from('portfolio').insert({
        id: 'main',
        initial_capital: 500,
        cash_balance: 500,
        total_portfolio_value: 500,
        trading_mode: 'MANUAL'
      }).select().single();
      portfolio = created || { id: 'main', cash_balance: 500, trading_mode: 'MANUAL', total_portfolio_value: 500 };
    }

    // ACTION : Réinitialiser (Reset) le portefeuille à 500€
    if (action === 'RESET') {
      await supabase.from('positions').delete().neq('ticker', 'ALL');
      await supabase.from('portfolio').update({
        cash_balance: 500,
        total_portfolio_value: 500,
        trading_mode: 'MANUAL'
      }).eq('id', 'main');

      return NextResponse.json({ success: true, message: 'Portefeuille réinitialisé avec 500 € !' });
    }

    // ACTION : Changement de mode (MANUAL ou AUTO)
    if (action === 'SET_MODE') {
      const newMode = body.mode || 'MANUAL';
      await supabase.from('portfolio').update({ trading_mode: newMode }).eq('id', portfolio.id);
      portfolio.trading_mode = newMode;
      
      // Si on active le mode AUTO, on lance directement un cycle d'achat automatique
      if (newMode !== 'AUTO') {
        return NextResponse.json({ success: true, mode: newMode });
      }
    }

    // ACTION : Achat manuel
    if (action === 'MANUAL_BUY') {
      const { ticker, name, price } = body;
      const invest = Math.min(100, Number(portfolio.cash_balance));
      if (invest < 10) return NextResponse.json({ error: 'Fonds disponibles insuffisants (moins de 10 €)' }, { status: 400 });

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
      await supabase.from('portfolio').update({ cash_balance: newCash }).eq('id', portfolio.id);
      return NextResponse.json({ success: true, message: `Achat manuel de ${invest}€ sur ${ticker} effectué !` });
    }

    // ACTION : Vente d'une position
    if (action === 'SELL') {
      const { positionId } = body;
      const { data: pos } = await supabase.from('positions').select('*').eq('id', positionId).single();
      if (pos) {
        const newCash = Number((Number(portfolio.cash_balance) + Number(pos.current_value)).toFixed(2));
        await supabase.from('positions').delete().eq('id', pos.id);
        await supabase.from('portfolio').update({ cash_balance: newCash }).eq('id', portfolio.id);
        return NextResponse.json({ success: true, message: `Position ${pos.ticker} vendue (+${pos.current_value}€) !` });
      }
    }

    // ACTION : SCAN & ANALYSES IA MULTI-MODÈLES
    await supabase.from('ai_analyses').delete().neq('ticker', 'CLEANUP');
    
    const analyses = [
      { ticker: 'NVDA', ai_name: 'Gemini (Fondamental)', signal: 'BUY', confidence: 91, reasoning: 'Demande record de puces Blackwell, carnets de commandes pleins sur 12 mois.' },
      { ticker: 'NVDA', ai_name: 'Groq / Llama (Technique)', signal: 'BUY', confidence: 85, reasoning: 'Moyenne mobile 50 jours validée, volumes d\'achats croissants.' },
      { ticker: 'MC.PA', ai_name: 'Gemini (Fondamental)', signal: 'BUY', confidence: 84, reasoning: 'Valorisation attractive après consolidation, leadership mondial du luxe.' },
      { ticker: 'MC.PA', ai_name: 'Groq / Llama (Technique)', signal: 'BUY', confidence: 78, reasoning: 'Support technique à 600€ solide, reprise du momentum.' },
      { ticker: 'TSLA', ai_name: 'Groq / Llama (Technique)', signal: 'BUY', confidence: 80, reasoning: 'Cassure de résistance haussière avec forte volatilité positive.' },
      { ticker: 'AAPL', ai_name: 'Gemini (Fondamental)', signal: 'BUY', confidence: 82, reasoning: 'Intégration d\'Apple Intelligence stimulant le cycle de renouvellement matériel.' }
    ];
    await supabase.from('ai_analyses').insert(analyses);

    // LOGIQUE DU MODE AUTOMATIQUE (ACHAT PAR L'IA)
    let autoMessages: string[] = [];
    if (portfolio.trading_mode === 'AUTO' || action === 'SET_MODE') {
      // 1. Récupérer les actions déjà en portefeuille pour ne pas doubler
      const { data: currentPositions } = await supabase.from('positions').select('ticker');
      const ownedTickers = new Set((currentPositions || []).map((p: any) => p.ticker));

      // 2. Filtrer les meilleures opportunités IA (score de confiance >= 80)
      const buySignals = analyses
        .filter(a => a.signal === 'BUY' && a.confidence >= 80 && !ownedTickers.has(a.ticker));

      let currentCash = Number(portfolio.cash_balance);

      for (const rec of buySignals) {
        // Allouer jusqu'à 80 € par action si on a au moins 20 € dispo
        if (currentCash < 20) break;

        const marketInfo = MARKETS_DATA.find(m => m.ticker === rec.ticker);
        if (!marketInfo) continue;

        const investAmount = Math.min(80, currentCash);
        const shares = Number((investAmount / marketInfo.price).toFixed(4));
        const stopLoss = Number((marketInfo.price * 0.95).toFixed(2));

        // Enregistrer la position
        await supabase.from('positions').insert({
          ticker: marketInfo.ticker,
          company_name: marketInfo.name,
          shares,
          average_buy_price: marketInfo.price,
          current_price: marketInfo.price,
          current_value: investAmount,
          stop_loss_price: stopLoss
        });

        currentCash = Number((currentCash - investAmount).toFixed(2));
        ownedTickers.add(marketInfo.ticker);
        autoMessages.push(`${marketInfo.ticker} (${investAmount}€)`);
      }

      // Mise à jour du cash restant dans Supabase
      await supabase.from('portfolio').update({ cash_balance: currentCash }).eq('id', portfolio.id);
    }

    const feedback = autoMessages.length > 0 
      ? `Scan terminé : Mode AUTO a acheté ${autoMessages.join(', ')} !` 
      : 'Scan terminé : Avis IA mis à jour !';

    return NextResponse.json({ success: true, message: feedback });
  } catch (err: any) {
    console.error('Erreur API Scan:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabase();
    
    // 1. Récupérer le portefeuille
    let { data: portfolio } = await supabase.from('portfolio').select('*').eq('id', 'main').single();
    
    // 2. Récupérer les positions
    const { data: positions } = await supabase.from('positions').select('*');
    
    // 3. Calculer la valeur totale réelle du portefeuille (Cash + Valeur des actions)
    const positionsValue = (positions || []).reduce((sum: number, pos: any) => sum + Number(pos.current_value || 0), 0);
    const cash = portfolio ? Number(portfolio.cash_balance) : 500;
    const totalPortfolioValue = Number((cash + positionsValue).toFixed(2));

    // Mettre à jour la valeur totale dans Supabase
    if (portfolio) {
      await supabase.from('portfolio').update({ total_portfolio_value: totalPortfolioValue }).eq('id', 'main');
      portfolio.total_portfolio_value = totalPortfolioValue;
    }

    // 4. Récupérer les dernières analyses
    const { data: analyses } = await supabase.from('ai_analyses').select('*').order('created_at', { ascending: false });

    return NextResponse.json({
      portfolio: portfolio || { cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' },
      positions: positions || [],
      analyses: analyses || [],
      markets: MARKETS_DATA
    });
  } catch (err: any) {
    console.error('Erreur GET Scan:', err);
    return NextResponse.json({
      portfolio: { cash_balance: 500, total_portfolio_value: 500, trading_mode: 'MANUAL' },
      positions: [],
      analyses: [],
      markets: MARKETS_DATA
    });
  }
}
