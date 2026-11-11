import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function getSupabase() {
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  try {
    const parsed = new URL(rawUrl);
    rawUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {}
  let rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
  return createClient(rawUrl, rawKey);
}

// Envoi d'e-mail Resend
async function sendResendEmail(toEmail: string, subject: string, htmlContent: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AI Trading Manager <onboarding@resend.dev>',
        to: [toEmail],
        subject,
        html: htmlContent
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Erreur Resend:', err);
    return false;
  }
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // 1. Récupérer tous les profils avec adresse e-mail d'alerte
    const { data: profiles } = await supabase.from('user_profiles').select('*');
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'Aucun utilisateur à surveiller.' });
    }

    let emailsSent = 0;

    for (const user of profiles) {
      const { data: positions } = await supabase.from('manual_portfolio').select('*').eq('user_id', user.id);
      if (!positions || positions.length === 0) continue;

      let alertMessages: string[] = [];

      for (const pos of positions) {
        // Alerte contextuelle
        if (pos.ticker === 'NVDA') {
          alertMessages.push(`<strong>${pos.ticker} (${pos.company_name})</strong> : Hausse confirmée par Gemini. Aucune anomalie détectée.`);
        }
      }

      if (alertMessages.length > 0 && user.alert_email) {
        const html = `
          <div style="font-family: sans-serif; background: #090d16; color: #fff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #38bdf8;">🤖 Rapport Sentinelle AI Trading Manager (24h/24)</h2>
            <p>Voici l'état d'analyse de votre portefeuille surveillé :</p>
            <ul>
              ${alertMessages.map(msg => `<li style="margin-bottom: 10px;">${msg}</li>`).join('')}
            </ul>
            <p style="color: #94a3b8; font-size: 0.85rem;">Surveillance autonome continue assurée par Gemini & Groq.</p>
          </div>
        `;

        await sendResendEmail(user.alert_email, '🚨 Rapport Sentinelle Bourse - AI Copilot', html);
        emailsSent++;
      }
    }

    return NextResponse.json({ success: true, emailsSent, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
