"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link';
import { useRouter } from 'next/navigation';
import { createLinkToken } from '@/lib/actions/user.actions';
import toast from 'react-hot-toast';

interface RelinkBankButtonProps {
  user: User;
  bankId: string;
  variant?: "primary" | "ghost";
}

const RelinkBankButton = ({ user, bankId, variant = "primary" }: RelinkBankButtonProps) => {
  const router = useRouter();
  const [token, setToken] = useState('');

  useEffect(() => {
    const getLinkToken = async () => {
      const data = await createLinkToken(user);
      setToken(data?.linkToken ?? '');
    };
    getLinkToken();
  }, [user]);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken: public_token, bankId }),
      });

      if (response.ok) {
        toast.success('Bank account re-linked successfully');
        router.push(`/?refresh=${Date.now()}`);
        setTimeout(() => window.location.reload(), 100);
      } else {
        toast.error('Failed to re-link bank account');
      }
    } catch {
      toast.error('Failed to re-link bank account');
    }
  }, [bankId, router]);

  const config: PlaidLinkOptions = { token, onSuccess };
  const { open, ready } = usePlaidLink(config);

  return (
    <Button
      onClick={() => open()}
      disabled={!ready}
      variant={variant === "primary" ? "default" : variant}
      className="plaidlink-primary"
    >
      Re-link Bank Account
    </Button>
  );
};

export default RelinkBankButton;
