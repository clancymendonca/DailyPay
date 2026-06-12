"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-24 font-semibold text-gray-900">Something went wrong</h2>
      <p className="text-14 max-w-md text-gray-600">
        We couldn&apos;t load your dashboard. Please try again or contact support if the problem persists.
      </p>
      <Button onClick={reset} variant="default">
        Try again
      </Button>
    </section>
  );
}
