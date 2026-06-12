import { NextRequest, NextResponse } from 'next/server';
import { getLoggedInUser, getBank, updateBankAccount } from '@/lib/actions/user.actions';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limited = rateLimit(`exchange-token:${ip}`, 5, 60_000);
    if (!limited.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const loggedIn = await getLoggedInUser();
    if (!loggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicToken, bankId } = await request.json();
    if (!publicToken || !bankId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const bank = await getBank({ documentId: bankId, requesterId: loggedIn.$id });
    if (!bank) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { plaidClient } = await import('@/lib/plaid');
    const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = response.data.access_token;

    const updatedBank = await updateBankAccount({
      bankId,
      accessToken,
      requesterId: loggedIn.$id,
    });

    if (!updatedBank) {
      return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error exchanging token:', error);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
