"use client";

import { useState, type ReactElement } from "react";
import { api } from "@pingchat/convex/convex/_generated/api";
import { useForm } from "@tanstack/react-form";
import { useAction } from "convex/react";
import { Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { z } from "zod";

import { useCurrentSidebarUser } from "~/integrations/convex/current-user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

interface CurrentUserSettingsDialogProps {
  trigger: ReactElement;
}

type SidebarStatus = "online" | "idle" | "dnd" | "invisible" | "offline";
const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters."),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters.")
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from current password."
  });
const COMMON_EMAIL_DOMAINS = new Set([
  "aol.com",
  "gmail.com",
  "gmx.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "yahoo.com"
]);

function avatarFallback(seed: string) {
  return seed.trim().charAt(0).toUpperCase() || "?";
}

function statusColorClass(status: SidebarStatus) {
  if (status === "online") {
    return "bg-emerald-500";
  }
  if (status === "idle") {
    return "bg-amber-500";
  }
  if (status === "dnd") {
    return "bg-rose-500";
  }
  return "bg-zinc-500";
}

function formatStatusLabel(status: SidebarStatus) {
  if (status === "dnd") {
    return "Do Not Disturb";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return "********";
  }
  const visibleChars = Math.min(local.length, 2);
  const maskedLocal =
    local.slice(0, visibleChars) +
    "*".repeat(Math.max(local.length - visibleChars, 6));
  const normalizedDomain = domain.toLowerCase();
  if (COMMON_EMAIL_DOMAINS.has(normalizedDomain)) {
    return `${maskedLocal}@${normalizedDomain}`;
  }

  const domainParts = normalizedDomain.split(".");
  if (domainParts.length < 2) {
    const maskedDomain =
      normalizedDomain.slice(0, 2) +
      "*".repeat(Math.max(normalizedDomain.length - 2, 4));
    return `${maskedLocal}@${maskedDomain}`;
  }

  const useTwoPartSuffix =
    domainParts.length >= 3 &&
    (domainParts.at(-1)?.length ?? 0) === 2 &&
    (domainParts.at(-2)?.length ?? 0) <= 3;
  const suffixPartCount = useTwoPartSuffix ? 2 : 1;
  const suffix = domainParts.slice(-suffixPartCount).join(".");
  const prefix = domainParts.slice(0, -suffixPartCount).join(".");
  const maskedPrefix =
    prefix.slice(0, 2) + "*".repeat(Math.max(prefix.length - 2, 4));

  return `${maskedLocal}@${maskedPrefix}.${suffix}`;
}

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

function ChangePasswordModal() {
  const changeCurrentUserPassword = useAction(
    api.users.changeCurrentUserPassword
  );
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
    validators: {
      onChange: changePasswordSchema
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        await changeCurrentUserPassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword
        });
        setIsOpen(false);
        form.reset();
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to change password."
        );
      }
    }
  });

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (!nextOpen) {
          setSubmitError(null);
          form.reset();
        }
      }}
      open={isOpen}
    >
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="secondary">
          Change Password
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field name="currentPassword">
            {(field) => {
              const error = field.state.meta.isTouched
                ? field.state.meta.errors
                    .map((item) => getErrorMessage(item))
                    .find(Boolean)
                : null;

              return (
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    autoComplete="current-password"
                    id="current-password"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    type="password"
                    value={field.state.value}
                  />
                  {error ? (
                    <p className="text-destructive text-xs">{error}</p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="newPassword">
            {(field) => {
              const error = field.state.meta.isTouched
                ? field.state.meta.errors
                    .map((item) => getErrorMessage(item))
                    .find(Boolean)
                : null;

              return (
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    autoComplete="new-password"
                    id="new-password"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    type="password"
                    value={field.state.value}
                  />
                  {error ? (
                    <p className="text-destructive text-xs">{error}</p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => {
              const error = field.state.meta.isTouched
                ? field.state.meta.errors
                    .map((item) => getErrorMessage(item))
                    .find(Boolean)
                : null;

              return (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    autoComplete="new-password"
                    id="confirm-password"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    type="password"
                    value={field.state.value}
                  />
                  {error ? (
                    <p className="text-destructive text-xs">{error}</p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          {submitError ? (
            <p className="text-destructive text-sm">{submitError}</p>
          ) : null}

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button disabled={!canSubmit || isSubmitting} type="submit">
                  {isSubmitting ? "Updating..." : "Update password"}
                </Button>
              </div>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CurrentUserSettingsDialog({
  trigger
}: CurrentUserSettingsDialogProps) {
  const { user } = useCurrentSidebarUser();
  const { resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isEmailVisible, setIsEmailVisible] = useState(false);

  const accountName = user?.name ?? "Not set";
  const accountHandle = user?.handle ?? "Not set";
  const accountStatus: SidebarStatus = user?.status ?? "offline";
  const accountStatusLabel = formatStatusLabel(accountStatus);
  const displayNameValue = user?.displayName ?? null;
  const usernameValue = user?.username ?? null;
  const emailValue = user?.email ?? null;
  const isDarkTheme = resolvedTheme !== "light";
  const themeLabel = isDarkTheme ? "Dark" : "Light";

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (nextOpen) {
          setIsEmailVisible(false);
        }
      }}
      open={isOpen}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="h-[80vh]! w-[80vw]! max-w-[80vw]! overflow-hidden border-white/15 bg-black/35 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-[80vw]!">
        <div className="grid h-full min-h-0 grid-cols-1 sm:grid-cols-[13.5rem_minmax(0,1fr)]">
          <aside className="border-border/40 flex h-full min-h-0 flex-col overflow-y-auto border-b bg-white/4 p-3 pt-5 backdrop-blur-xl sm:border-r sm:border-b-0">
            <h2 className="text-muted-foreground px-2 py-1 text-[10px] font-medium tracking-[0.11em] uppercase">
              User Settings
            </h2>
            <nav className="mt-2 space-y-1" aria-label="User settings sections">
              <Button
                aria-current="page"
                className="w-full justify-start gap-2.5 bg-white/12 text-white hover:text-white"
                size="sm"
                type="button"
                variant="ghost"
              >
                <User aria-hidden="true" className="size-4" />
                My Account
              </Button>
            </nav>
            <div className="mt-auto border-t border-white/10 pt-3">
              <p className="text-muted-foreground px-2 pb-1 text-[10px] font-medium tracking-[0.11em] uppercase">
                Theme
              </p>
              <Button
                className="w-full justify-between gap-2 text-zinc-300 hover:text-zinc-100"
                onClick={() => {
                  setTheme(isDarkTheme ? "light" : "dark");
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                <span className="inline-flex items-center gap-2.5">
                  {isDarkTheme ? (
                    <Sun aria-hidden="true" className="size-4" />
                  ) : (
                    <Moon aria-hidden="true" className="size-4" />
                  )}
                  Switch Theme
                </span>
                <span className="rounded-full border border-white/15 bg-white/6 px-2 py-0.5 text-[10px] tracking-wide uppercase">
                  {themeLabel}
                </span>
              </Button>
            </div>
          </aside>

          <section className="h-full min-h-0 overflow-y-auto bg-black/20 px-24 py-6">
            <DialogHeader>
              <DialogTitle>My Account</DialogTitle>
              <DialogDescription>
                Manage your profile identity and account contact details.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/4 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative shrink-0">
                    <Avatar className="border-border/60 bg-background size-16 border">
                      {user ? (
                        <AvatarImage
                          alt={`${accountName} profile picture`}
                          src={user.avatarUrl}
                        />
                      ) : null}
                      <AvatarFallback>
                        {avatarFallback(accountName)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      aria-label={`Status: ${accountStatusLabel}`}
                      className={cn(
                        "absolute right-0 bottom-0 size-4 rounded-full border-2 border-[hsl(var(--background))]",
                        statusColorClass(accountStatus)
                      )}
                      role="status"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-zinc-50">{accountName}</p>
                    <p className="truncate text-zinc-300">{accountHandle}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/3 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 py-4 first:pt-0">
                    <div className="min-w-0">
                      <p className="text-zinc-300">Display Name</p>
                      <p className="mt-1 truncate text-zinc-100">
                        {displayNameValue ?? "Not set"}
                      </p>
                    </div>
                    <Button size="sm" type="button" variant="ghost">
                      Edit
                    </Button>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 py-4">
                    <div className="min-w-0">
                      <p className="text-zinc-300">Username</p>
                      <p className="mt-1 truncate text-zinc-100">
                        {usernameValue ?? "Not set"}
                      </p>
                    </div>
                    <Button size="sm" type="button" variant="ghost">
                      Edit
                    </Button>
                  </div>

                  <div className="flex items-start justify-between gap-4 pt-4">
                    <div className="min-w-0">
                      <p className="text-zinc-300">Email</p>
                      <p className="mt-1 flex items-center gap-2 text-zinc-100">
                        {emailValue
                          ? isEmailVisible
                            ? emailValue
                            : maskEmail(emailValue)
                          : "Not set"}
                        {emailValue ? (
                          <button
                            className="text-primary hover:underline"
                            onClick={() => {
                              setIsEmailVisible((current) => !current);
                            }}
                            type="button"
                          >
                            {isEmailVisible ? "Hide" : "Reveal"}
                          </button>
                        ) : null}
                      </p>
                    </div>
                    <Button size="sm" type="button" variant="ghost">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/3 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <p className="text-zinc-200">Passwords</p>
                <p className="mt-1 text-zinc-400">
                  Change your account password for better security.
                </p>
                <div className="mt-4">
                  <ChangePasswordModal />
                </div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
