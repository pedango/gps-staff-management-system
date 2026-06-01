"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useState, type FormEvent } from "react";
import { LOGIN_RATE_LIMIT_WINDOW_MINUTES } from "@/lib/login-rate-constants";

export type UseLoginFormReturn = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  error: string | null;
  isLoading: boolean;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function useLoginForm(): UseLoginFormReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);
      try {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl,
        });
        if (res?.status === 429) {
          setError(
            `Too many failed sign-in attempts. Please wait up to ${LOGIN_RATE_LIMIT_WINDOW_MINUTES} minutes, then try again.`,
          );
          return;
        }
        if (res?.error) {
          setError("Invalid email or password.");
          return;
        }
        if (res?.ok) {
          router.replace(callbackUrl);
          router.refresh();
        }
      } catch {
        setError("Unable to sign in right now.");
      } finally {
        setIsLoading(false);
      }
    },
    [callbackUrl, email, password, router],
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    error,
    isLoading,
    handleSubmit,
  };
}
