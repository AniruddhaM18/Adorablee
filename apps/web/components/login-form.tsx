"use client";

import Link from "next/link";
import { useState } from "react";

import logo from "../public/adlogo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import LogoIcon from "./ui/logo";
import { useAuth } from "@/context/AuthContext";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setIsSubmitting(true);

          const form = e.currentTarget;
          const email = (form.email as HTMLInputElement).value;
          const password = (form.password as HTMLInputElement).value;

          const result = await login(email, password);
          
          if (!result.success) {
            setError(result.error || "Login failed");
          }
          
          setIsSubmitting(false);
        }}
      >
        <FieldGroup>
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-12 items-center justify-center rounded-md">
                <LogoIcon className="h-12 w-12 text-neutral-300" />
              </div>

              <span className="sr-only">Adorable</span>
            </Link>

            <h1 className="text-xl font-bold text-neutral-100">
              Welcome back to Adorable
            </h1>

            <FieldDescription className="text-neutral-300">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-neutral-100 underline underline-offset-4 hover:!text-neutral-300 transition-colors duration-150 ease-out active:scale-95"
              >
                Sign up
              </Link>
            </FieldDescription>
          </div>

          {/* Email */}
          <Field>
            <FieldLabel className="text-neutral-200" htmlFor="email">
              Email
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="yourname@mail.com"
              required
              className="text-neutral-300 border-neutral-500"
            />
          </Field>

          {/* Password */}
          <Field>
            <FieldLabel className="text-neutral-200" htmlFor="password">
              Password
            </FieldLabel>
            <Input
              id="password"
              type="password"
              required
              className="text-neutral-300 border-neutral-500"
            />
          </Field>

          {/* Error Message */}
          {error && (
            <Field>
              <div className="text-red-400 text-sm text-center">{error}</div>
            </Field>
          )}

          {/* Submit */}
          <Field>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-400 text-neutral-800 transition-all duration-200 ease-in-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
