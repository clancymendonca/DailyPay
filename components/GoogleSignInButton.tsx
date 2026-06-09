"use client";

import Image from "next/image";
import { Button } from "./ui/button";

const GoogleSignInButton = () => {
  const handleGoogleSignIn = () => {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
    if (!endpoint || !project) return;

    const success = `${window.location.origin}/`;
    const failure = `${window.location.origin}/sign-in`;
    const url = `${endpoint}/account/sessions/oauth2/google?project=${project}&success=${encodeURIComponent(success)}&failure=${encodeURIComponent(failure)}`;
    window.location.href = url;
  };

  return (
    <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn}>
      <Image src="/icons/google.svg" alt="Google" width={20} height={20} />
      Continue with Google
    </Button>
  );
};

export default GoogleSignInButton;
