import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Mail, Plus, Trash2, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type MemberExpiry, memberExpiryStatus } from "@/lib/memberExpiry";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  type SubscriptionMemberInput,
  subscriptionMembersService,
} from "@/services/subscriptionMembers";
import type { Subscription, SubscriptionMember } from "@/types";

interface MemberFormState {
  name: string;
  email: string;
  amount: string;
  expires_at: string;
  notes: string;
}

const EMPTY_FORM: MemberFormState = {
  name: "",
  email: "",
  amount: "",
  expires_at: "",
  notes: "",
};

function toFormState(member: SubscriptionMember): MemberFormState {
  return {
    name: member.name,
    email: member.email ?? "",
    amount: member.amount ? String(member.amount) : "",
    expires_at: (member.expires_at ?? "").slice(0, 10),
    notes: member.notes ?? "",
  };
}

function toInput(form: MemberFormState): SubscriptionMemberInput {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    amount: form.amount === "" ? 0 : Number(form.amount),
    expires_at: form.expires_at,
    notes: form.notes.trim(),
  };
}

/** Members with an expiry date first (soonest on top), undated ones last. */
function sortMembers(members: SubscriptionMember[]): SubscriptionMember[] {
  // Undated members get a date past any real one, so they sort last.
  const key = (member: SubscriptionMember) =>
    (member.expires_at ?? "").slice(0, 10) || "9999-12-31";
  return [...members].sort(
    (a, b) => key(a).localeCompare(key(b)) || a.name.localeCompare(b.name),
  );
}

export function MemberExpiryBadge({ expiry }: { expiry: MemberExpiry }) {
  const { t } = useTranslation();

  if (expiry.status === "none" || expiry.daysLeft === null) {
    return <Badge variant="outline">{t("member_no_expiry")}</Badge>;
  }
  if (expiry.status === "expired") {
    return (
      <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
        {t("member_expired")}
      </Badge>
    );
  }
  if (expiry.status === "expiring") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
        {expiry.daysLeft === 0
          ? t("member_expires_today")
          : t("member_expires_in_days", { count: expiry.daysLeft })}
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/15 dark:text-green-400">
      {t("member_active")}
    </Badge>
  );
}

function MemberForm({
  initial,
  saving,
  onSubmit,
  onCancel,
}: {
  initial: MemberFormState;
  saving: boolean;
  onSubmit: (form: MemberFormState) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial);

  const set = (field: keyof MemberFormState) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      aria-label={t("member_form")}
      className="space-y-3 rounded-2xl border bg-muted/30 p-4"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="member-name">{t("name")} *</Label>
          <Input
            id="member-name"
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="member-email">{t("email")}</Label>
          <Input
            id="member-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="member-amount">{t("member_amount")}</Label>
          <Input
            id="member-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="member-expires">{t("member_expires_at")}</Label>
          <Input
            id="member-expires"
            type="date"
            value={form.expires_at}
            onChange={(e) => set("expires_at")(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="member-notes">{t("notes")}</Label>
        <Textarea
          id="member-notes"
          rows={2}
          maxLength={1000}
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={saving || !form.name.trim()}>
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

export function SubscriptionMembersDialog({
  sub,
  userId,
  members,
  onClose,
}: {
  sub: Subscription;
  userId: string;
  members: SubscriptionMember[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // null: form hidden, "new": adding, otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const currency = sub.expand?.currency;
  const symbol = currency?.symbol ?? "$";
  const sorted = sortMembers(members);
  const total = members.reduce((sum, member) => sum + (member.amount ?? 0), 0);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.members(userId) });

  const saveMutation = useMutation({
    mutationFn: ({ id, form }: { id: string | null; form: MemberFormState }) =>
      id
        ? subscriptionMembersService.update(id, toInput(form))
        : subscriptionMembersService.create(userId, sub.id, toInput(form)),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success(t("member_saved"));
    },
    onError: () => toast.error(t("member_save_failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionMembersService.delete(id),
    onSuccess: () => {
      invalidate();
      toast.success(t("member_deleted"));
    },
    onError: () => toast.error(t("member_delete_failed")),
  });

  const editingMember = sorted.find((member) => member.id === editing);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[96vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden />
            {sub.name}
          </DialogTitle>
          <DialogDescription>{t("members_desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {members.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("members_summary", {
                count: members.length,
                total: formatPrice(total, symbol, { currencyCode: currency?.code }),
              })}
            </p>
          )}

          {sorted.length === 0 && editing === null ? (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("no_members")}
            </p>
          ) : (
            <ul className="space-y-2">
              {sorted.map((member) =>
                member.id === editing ? (
                  <li key={member.id}>
                    <MemberForm
                      initial={toFormState(member)}
                      saving={saveMutation.isPending}
                      onSubmit={(form) => saveMutation.mutate({ id: member.id, form })}
                      onCancel={() => setEditing(null)}
                    />
                  </li>
                ) : (
                  <li
                    key={member.id}
                    className="flex flex-col gap-2 rounded-xl border bg-background/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{member.name}</p>
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary"
                        >
                          <Mail className="h-3 w-3 shrink-0" aria-hidden />
                          {member.email}
                        </a>
                      )}
                      {member.notes && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {member.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      {(member.amount ?? 0) > 0 && (
                        <span className="font-mono text-sm font-bold">
                          {formatPrice(member.amount!, symbol, {
                            currencyCode: currency?.code,
                          })}
                        </span>
                      )}
                      {member.expires_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(member.expires_at.slice(0, 10))}
                        </span>
                      )}
                      <MemberExpiryBadge expiry={memberExpiryStatus(member.expires_at)} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500"
                        onClick={() => setEditing(member.id)}
                        title={t("edit")}
                        aria-label={t("edit")}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteId(member.id)}
                        title={t("delete")}
                        aria-label={t("delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}

          {editing === "new" ? (
            <MemberForm
              initial={EMPTY_FORM}
              saving={saveMutation.isPending}
              onSubmit={(form) => saveMutation.mutate({ id: null, form })}
              onCancel={() => setEditing(null)}
            />
          ) : (
            !editingMember && (
              <Button variant="outline" className="w-full" onClick={() => setEditing("new")}>
                <Plus className="mr-1.5 h-4 w-4" />
                {t("add_member")}
              </Button>
            )
          )}
        </div>

        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(nextOpen) => !nextOpen && setDeleteId(null)}
          title={t("delete_member")}
          description={t("confirm_delete_member")}
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        />
      </DialogContent>
    </Dialog>
  );
}
