import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialisation de Supabase côté serveur
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Liste d'actions surveillées par défaut (grandes valeurs liquides)
const WATCHLIST = [
  { ticker: 'NVDA', name: 'Nvidia Corp' },
  { ticker: 'AAPL', name: 'Apple Inc' },
  { ticker: 'MSFT', name: 'Microsoft' },
  { ticker: 'TSLA', name: 'Tesla Inc' },
  { ticker: 'SPY', name: 'S&P 500 ETF' }
];

// 1. Récupération des cours de marché réels
async function fetchMarketPrice(ticker: string): Promise<{ price: number; changePct: number }> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 }
    });
    if (!res.ok) throw new Error('Yahoo API error');
    const data = await res.json();
    const result = data.chart?.result?.[0];
    const quote = result?.meta?.regularMarketPrice;
    const prevClose = result?.meta?.chartPreviousClose || quote;
    const changePct = quote && prevClose ? ((quote - prevClose) / prevClose) * 100 : 0;
    return { price: Number(quote?.toFixed(2)) || 150.00, changePct: Number(changePct.toFixed(2)) };
  } catch {
    // Valeurs par défaut en cas d'interruption temporaire de flux
    const fallbacks: Record<string, number> = { NVDA: 135.5, AAPL: 228.0, MSFT: 420.0, TSLA: 245.0, SPY: 570.0 };
    return { price: fallbacks[ticker] || 100.0, changePct: 0.5 };
  }
}

// 2. IA 1 : Google Gemini (Analyse Fondamentale & Macro)
async function analyzeWithGemini(ticker: string, price: number, changePct: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { signal: 'HOLD', confidence: 50, reasoning: 'Clé Gemini manquante' };

  try {
    const prompt = `Tu es un gérant de portefeuille fondamental senior. Analyse l'action ${ticker} au cours de ${price}$ (variation récente: ${changePct}%).
Réponds EXCLUSIVEMENT en JSON valide avec ce format exact :
{"signal": "BUY" ou "SELL" ou "HOLD", "confidence": note entre 0 et 100, "targetPrice": nombre, "reasoning": "explication concise en 1 phrase en français"}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    return { signal: 'HOLD', confidence: 50, reasoning: 'Analyse fondamentale prudente' };
  }
}

// 3. IA 2 : Groq / Llama 3 (Analyse Technique & Momentum)
async function analyzeWithGroq(ticker: string, price: number, changePct: number) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { signal: 'HOLD', confidence: 50, reasoning: 'Clé Groq manquante' };

  try {
    const prompt = `Tu es un analyste quantitatif et technique. Évalue le momentum pour ${ticker} au cours de ${price}$ (${changePct}%).
Réponds UNIQUEMENT en JSON avec ce format :
{"signal": "BUY" ou "SELL" ou "HOLD", "confidence": note entre 0 et 100, "reasoning": "analyse technique courte en français"}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || '{}';
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return { signal: 'HOLD', confidence: 50, reasoning: 'Indicateurs techniques neutres' };
  }
}

// 4. Moteur d'Arbitrage et Exécution
export async function POST(req: Request) {
  return handleTradingCycle();
}

export async function GET(req: Request) {
  return handleTradingCycle();
}

async function handleTradingCycle() {
  const supabase = getSupabase();
  const logs: string[] = [];

  // Récupérer le portefeuille
  const { data: portfolio } = await supabase.from('portfolio').select('*').single();
  if (!portfolio) return NextResponse.json({ error: 'Portefeuille introuvable' }, { status: 404 });

  if (portfolio.is_halted) {
    return NextResponse.json({ message: 'Trading suspendu par sécurité (Circuit Breaker actif).' });
  }

  // --- SÉCURITÉ 1 : CONTRÔLE DES STOP-LOSS SUR LES POSITIONS DÉTENUES ---
  const { data: positions } = await supabase.from('positions').select('*');
  let currentInvested = 0;

  if (positions && positions.length > 0) {
    for (const pos of positions) {
      const market = await fetchMarketPrice(pos.ticker);
      const currentValue = Number((pos.shares * market.price).toFixed(2));
      const pnl = Number((currentValue - (pos.shares * pos.average_buy_price)).toFixed(2));
      const pnlPct = Number((((market.price - pos.average_buy_price) / pos.average_buy_price) * 100).toFixed(2));

      // Vérifier le Stop-Loss (seuil à -5%)
      if (market.price <= pos.stop_loss_price || pnlPct <= -Number(portfolio.max_position_loss_pct)) {
        // VENTE IMMÉDIATE DE PROTECTION
        const recoveredCash = Number((portfolio.cash_balance + currentValue).toFixed(2));
        
        await supabase.from('transactions').insert({
          ticker: pos.ticker,
          company_name: pos.company_name,
          order_type: 'SELL',
          shares: pos.shares,
          execution_price: market.price,
          total_amount: currentValue,
          realized_pnl: pnl,
          reasoning: `STOP-LOSS DÉCLENCHÉ : Protection du capital suite à une baisse de ${pnlPct}% (seuil max autorisé : -${portfolio.max_position_loss_pct}%)`,
          executed_by: 'RISK_MANAGER_BOT'
        });

        await supabase.from('positions').delete().eq('id', pos.id);
        await supabase.from('portfolio').update({
          cash_balance: recoveredCash,
          updated_at: new Date().toISOString()
        }).eq('id', portfolio.id);

        logs.push(`🛑 Stop-Loss exécuté sur ${pos.ticker} à ${market.price}$ (Perte limitée à ${pnl}€)`);
      } else {
        // Mise à jour de la valorisation normale
        await supabase.from('positions').update({
          current_price: market.price,
          current_value: currentValue,
          unrealized_pnl: pnl,
          unrealized_pnl_pct: pnlPct,
          updated_at: new Date().toISOString()
        }).eq('id', pos.id);

        currentInvested += currentValue;
      }
    }
  }

  // --- ANALYSE MULTI-IA SUR LES CANDIDATS ---
  for (const item of WATCHLIST) {
    const market = await fetchMarketPrice(item.ticker);
    
    // Appel simultané des 2 IA indépendantes
    const [gemini, groq] = await Promise.all([
      analyzeWithGemini(item.ticker, market.price, market.changePct),
      analyzeWithGroq(item.ticker, market.price, market.changePct)
    ]);

    // Enregistrement des analyses en base
    await supabase.from('ai_analyses').insert([
      { ticker: item.ticker, ai_name: 'Gemini-Fundamental', signal: gemini.signal || 'HOLD', confidence: gemini.confidence || 50, target_price: gemini.targetPrice || market.price, reasoning: gemini.reasoning || '' },
      { ticker: item.ticker, ai_name: 'Llama-Technical', signal: groq.signal || 'HOLD', confidence: groq.confidence || 50, target_price: market.price, reasoning: groq.reasoning || '' }
    ]);

    // Arbitrage : Vérification du consensus et des règles de risque
    const isBothBuy = gemini.signal === 'BUY' && groq.signal === 'BUY';
    const avgConfidence = ((gemini.confidence || 50) + (groq.confidence || 50)) / 2;
    const maxAllocation = Number(portfolio.initial_capital) * (Number(portfolio.max_allocation_per_stock_pct) / 100); // 100 € max

    // Si opportunité majeure validée et liquidités suffisantes
    if (isBothBuy && avgConfidence >= 65 && portfolio.cash_balance >= 50) {
      const alreadyOwned = positions?.some(p => p.ticker === item.ticker);

      if (!alreadyOwned) {
        const investAmount = Math.min(portfolio.cash_balance, maxAllocation);
        const shares = Number((investAmount / market.price).toFixed(4));
        const stopLossPrice = Number((market.price * 0.95).toFixed(2)); // Stop-loss fixé 5% sous le prix d'achat

        if (portfolio.trading_mode === 'AUTO') {
          // EXÉCUTION AUTOMATIQUE VIRTUELLE
          await supabase.from('positions').insert({
            ticker: item.ticker,
            company_name: item.name,
            shares: shares,
            average_buy_price: market.price,
            current_price: market.price,
            current_value: investAmount,
            stop_loss_price: stopLossPrice
          });

          await supabase.from('transactions').insert({
            ticker: item.ticker,
            company_name: item.name,
            order_type: 'BUY',
            shares: shares,
            execution_price: market.price,
            total_amount: investAmount,
            reasoning: `Double validation IA : Gemini (${gemini.confidence}%) & Groq (${groq.confidence}%). Stop-loss paramétré à ${stopLossPrice}$`,
            executed_by: 'AI_ARBITER'
          });

          const newCash = Number((portfolio.cash_balance - investAmount).toFixed(2));
          await supabase.from('portfolio').update({
            cash_balance: newCash,
            updated_at: new Date().toISOString()
          }).eq('id', portfolio.id);

          logs.push(`✅ Achat auto exécuté sur ${item.ticker}: ${investAmount}€ investi.`);
        } else {
          logs.push(`💡 Opportunité forte détectée sur ${item.ticker} (Mode ${portfolio.trading_mode}: En attente de validation)`);
        }
      }
    }
  }

  // Recalcul du total portefeuille
  const totalVal = Number((portfolio.cash_balance + currentInvested).toFixed(2));
  await supabase.from('portfolio').update({
    total_invested: currentInvested,
    total_portfolio_value: totalVal,
    updated_at: new Date().toISOString()
  }).eq('id', portfolio.id);

  return NextResponse.json({
    success: true,
    totalPortfolioValue: totalVal,
    logs: logs,
    timestamp: new Date().toISOString()
  });
}
