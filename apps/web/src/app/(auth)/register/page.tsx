"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const registerSchema = z.object({
  displayName: z.string().trim().max(80, "Display name is too long."),
  email: z.string().email("Enter a valid email."),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

function getErrorMessage(error: unknown): string | null {
  if (typeof error === "string") {
    return error;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return null;
}

export default function RegisterPage() {
  const { signIn, signOut } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [status, setStatus] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      displayName: "",
      email: "",
      username: "",
      password: ""
    },
    validators: {
      onChange: registerSchema
    },
    onSubmit: async ({ value }) => {
      if (isLoading || isAuthenticated) {
        return;
      }
      setStatus(null);
      try {
        await signIn("password", {
          flow: "signUp",
          displayName: value.displayName.trim(),
          email: value.email.trim().toLowerCase(),
          username: value.username.trim(),
          password: value.password
        });
        setStatus({ tone: "success", text: "Account created." });
      } catch (error) {
        setStatus({
          tone: "error",
          text: error instanceof Error ? error.message : "Registration failed."
        });
      }
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-md space-y-6 rounded-xl border border-border/60 bg-card p-8 text-card-foreground shadow-sm">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm text-muted-foreground">Start your workspace.</p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field name="username">
            {(field) => {
              const error =
                field.state.meta.isTouched
                  ? field.state.meta.errors
                      .map((item) => getErrorMessage(item))
                      .find(Boolean)
                  : null;
              return (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    autoComplete="username"
                    id="username"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    type="text"
                    value={field.state.value}
                  />
                  {error ? (
                    <p className="text-xs text-destructive">{error}</p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="displayName">
            {(field) => {
              const error =
                field.state.meta.isTouched
                  ? field.state.meta.errors
                      .map((item) => getErrorMessage(item))
                      .find(Boolean)
                  : null;
              return (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    autoComplete="name"
                    id="displayName"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    placeholder="Optional"
                    type="text"
                    value={field.state.value}
                  />
                  {error ? (
                    <p className="text-xs text-destructive">{error}</p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="email">
            {(field) => {
              const error =
                field.state.meta.isTouched
                  ? field.state.meta.errors
                      .map((item) => getErrorMessage(item))
                      .find(Boolean)
                  : null;
              return (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    autoComplete="email"
                    id="email"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    type="email"
                    value={field.state.value}
                  />
                  {error ? (
                    <p className="text-xs text-destructive">{error}</p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const error =
                field.state.meta.isTouched
                  ? field.state.meta.errors
                      .map((item) => getErrorMessage(item))
                      .find(Boolean)
                  : null;
              return (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    autoComplete="new-password"
                    id="password"
                    minLength={8}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    type="password"
                    value={field.state.value}
                  />
                  {error ? (
                    <p className="text-xs text-destructive">{error}</p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                className="mt-1 w-full"
                disabled={!canSubmit || isLoading || isAuthenticated}
                type="submit"
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </Button>
            )}
          </form.Subscribe>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="underline underline-offset-4" href="/login">
              Login
            </Link>
          </p>
        </form>

        {isAuthenticated ? (
          <Button
            className="w-full"
            onClick={() => {
              void signOut();
            }}
            type="button"
            variant="outline"
          >
            Sign out
          </Button>
        ) : null}

        {status ? (
          <p
            className={`text-sm ${status.tone === "error" ? "text-destructive" : "text-muted-foreground"}`}
          >
            {status.text}
          </p>
        ) : null}
      </section>
    </main>
  );
}
