import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CreditCard,
  Edit,
  ExternalLink,
  FileText,
  History,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { MemberExpiryBadge } from "@/components/subscriptions/SubscriptionMembersDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBillingPeriod } from "@/lib/billingPeriods";
import { memberExpiryStatus } from "@/lib/memberExpiry";
import { queryKeys } from "@/lib/queryKeys";
import { isCredit } from "@/lib/recordTypes";
import { daysUntil, formatDate, formatPrice, sanitizeHref, toMonthly } from "@/lib/utils";
import { subscriptionHistoryService } from "@/services/subscriptionHistory";
import type { Subscription, SubscriptionMember } from "@/types";

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-2xl border bg-card/60 p-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h3>
      <dl className="space-y-1.5">{children}</dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-base font-bold">{value}</p>
    </div>
  );
}

/**
 * Everything about one subscription on a single screen, opened by clicking its
 * card. Editing, members and history stay in their own dialogs; this one only
 * summarises and links to them.
 */
export function SubscriptionDetailDialog({
  sub,
  userId,
  members,
  onClose,
  onEdit,
  onMembers,
  onHistory,
}: {
  sub: Subscription;
  userId: string;
  members: SubscriptionMember[];
  onClose: () => void;
  onEdit: () => void;
  onMembers: () => void;
  onHistory: () => void;
}) {
  const { t } = useTranslation();
  const credit = isCredit(sub);
  const currency = sub.expand?.currency;
  const symbol = currency?.symbol ?? "$";
  const money = (value: number) => formatPrice(value, symbol, { currencyCode: currency?.code });
  const cycleName = sub.expand?.cycle?.name ?? "Monthly";
  const monthly = toMonthly(sub.price, cycleName, sub.frequency || 1);
  const days = sub.next_payment ? daysUntil(sub.next_payment) : null;
  const href = sanitizeHref(sub.url);
  const membersTotal = members.reduce((sum, member) => sum + (member.amount ?? 0), 0);

  const { data: history } = useQuery({
    queryKey: queryKeys.subscriptions.history(userId, sub.id),
    queryFn: () => subscriptionHistoryService.get(sub.id),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[96vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-background text-xl font-bold">
              <SubscriptionLogo sub={sub} imgClassName="rounded-2xl object-contain p-1" />
            </span>
            <span className="min-w-0">
              <span className="block truncate">{sub.name}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-normal">
                {sub.expand?.category && (
                  <Badge variant="secondary">{sub.expand.category.name}</Badge>
                )}
                {credit && (
                  <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/15 dark:text-green-400">
                    {t("credit_income")}
                  </Badge>
                )}
                <Badge variant={sub.inactive ? "destructive" : "outline"}>
                  {sub.inactive ? t("inactive_label") : t("active")}
                </Badge>
              </span>
            </span>
          </DialogTitle>
          <DialogDescription>{t("subscription_summary_desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              label={credit ? t("one_time") : formatBillingPeriod(t, cycleName, sub.frequency || 1)}
              value={`${credit ? "+" : ""}${money(sub.price)}`}
            />
            {!credit && <Stat label={t("per_month")} value={money(monthly)} />}
            {!credit && <Stat label={t("per_year")} value={money(monthly * 12)} />}
            {history && (
              <Stat
                label={credit ? t("total_received") : t("total_spent")}
                value={money(history.totals.estimated_total)}
              />
            )}
          </div>

          <Section icon={<CalendarDays className="h-3.5 w-3.5" />} title={t("billing")}>
            {sub.next_payment && !sub.inactive && (
              <Row label={t(credit ? "received_on" : "next_payment")}>
                {formatDate(sub.next_payment)}
                {days !== null && days >= 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({t("in_days", { count: days })})
                  </span>
                )}
              </Row>
            )}
            {sub.start_date && <Row label={t("start_date")}>{formatDate(sub.start_date)}</Row>}
            {!credit && <Row label={t("auto_renew")}>{sub.auto_renew ? t("yes") : t("no")}</Row>}
            {(sub.payment_limit ?? 0) > 0 && (
              <Row label={t("payments")}>
                {t("payments_progress", {
                  completed: sub.payments_completed ?? 0,
                  total: sub.payment_limit,
                })}
              </Row>
            )}
            {sub.end_date && <Row label={t("end_date")}>{formatDate(sub.end_date)}</Row>}
            {sub.cancellation_date && (
              <Row label={t("cancellation_date")}>{formatDate(sub.cancellation_date)}</Row>
            )}
            {!credit && (
              <Row label={t("notifications")}>
                {sub.notify ? t("notify_days_before_value", { count: sub.notify_days_before }) : t("no")}
              </Row>
            )}
          </Section>

          <Section icon={<CreditCard className="h-3.5 w-3.5" />} title={t("payment_info")}>
            <Row label={t("currency")}>
              {currency ? `${currency.symbol} ${currency.code}` : "—"}
            </Row>
            <Row label={t("payment_method")}>{sub.expand?.payment_method?.name ?? "—"}</Row>
            <Row label={t("payment_account")}>{sub.payment_account || "—"}</Row>
            <Row label={t("payer")}>{sub.expand?.payer?.name ?? "—"}</Row>
          </Section>

          <Section icon={<Users className="h-3.5 w-3.5" />} title={t("members")}>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("no_members")}</p>
            ) : (
              <>
                <Row label={t("members")}>
                  {t("members_summary", { count: members.length, total: money(membersTotal) })}
                </Row>
                <ul className="space-y-1 pt-1">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate">{member.name}</span>
                      <MemberExpiryBadge expiry={memberExpiryStatus(member.expires_at)} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Section>

          {(href || sub.notes) && (
            <Section icon={<FileText className="h-3.5 w-3.5" />} title={t("notes")}>
              {href && (
                <Row label={t("url")}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {href}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </Row>
              )}
              {sub.notes && (
                <p className="whitespace-pre-wrap break-words pt-1 text-sm">{sub.notes}</p>
              )}
            </Section>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button variant="outline" size="sm" onClick={onHistory}>
              <History className="mr-1.5 h-4 w-4" />
              {t("history")}
            </Button>
            <Button variant="outline" size="sm" onClick={onMembers}>
              <Users className="mr-1.5 h-4 w-4" />
              {t("manage_members")}
            </Button>
            <Button size="sm" onClick={onEdit}>
              <Edit className="mr-1.5 h-4 w-4" />
              {t("edit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
