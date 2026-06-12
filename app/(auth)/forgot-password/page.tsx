"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordRecovery } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await requestPasswordRecovery(email);
    setLoading(false);
    if (result.success) {
      toast.success("Recovery email sent if the account exists");
      router.push("/sign-in");
    } else {
      toast.error("Could not send recovery email");
    }
  };

  return (
    <section className="auth-form max-w-md mx-auto">
      <h1 className="text-24 font-semibold mb-2">Forgot password</h1>
      <p className="text-14 text-gray-600 mb-6">Enter your email to receive a password reset link.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send recovery email"}
        </Button>
      </form>
      <p className="text-14 mt-4 text-center">
        <Link href="/sign-in" className="form-link">Back to sign in</Link>
      </p>
    </section>
  );
}
