"use client";

import { useState } from "react";

export default function AccountSettingsForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirmation don't match");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, currentPassword, newPassword }),
    });
    setSubmitting(false);

    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not update account");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {success && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Account updated. Use your new email/password next time you log in.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Email (used to log in)</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Current password</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Required to save any change"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">New password (optional)</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave blank to keep your current password"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      {newPassword && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
