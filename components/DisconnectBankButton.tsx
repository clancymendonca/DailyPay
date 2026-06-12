"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteBankAccount } from "@/lib/actions/user.actions";
import { Button } from "./ui/button";

const DisconnectBankButton = ({ bankId }: { bankId: string }) => {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDisconnect = () => {
    startTransition(async () => {
      try {
        await deleteBankAccount({ bankId });
        toast.success("Bank account disconnected");
        window.location.reload();
      } catch {
        toast.error("Failed to disconnect bank account");
      }
    });
  };

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-12 text-red-600 hover:text-red-700"
        onClick={() => setConfirming(true)}
      >
        Disconnect
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={handleDisconnect}
      >
        {isPending ? "Removing..." : "Confirm disconnect"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
};

export default DisconnectBankButton;
