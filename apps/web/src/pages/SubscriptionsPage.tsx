import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { SubscriptionFormModal } from "@/components/SubscriptionFormModal";
import { SubscriptionDetailDialog } from "@/components/subscriptions/SubscriptionDetailDialog";
import { SubscriptionHistoryDialog } from "@/components/subscriptions/SubscriptionHistoryDialog";
import { SubscriptionMembersDialog } from "@/components/subscriptions/SubscriptionMembersDialog";
import { SubscriptionsFiltersPanel } from "@/components/subscriptions/SubscriptionsFiltersPanel";
import { SubscriptionsGrid } from "@/components/subscriptions/SubscriptionsGrid";
import {
  INITIAL_SUBSCRIPTION_FILTERS,
  type SubscriptionFiltersState,
  type SubscriptionSortKey,
} from "@/components/subscriptions/subscriptionsPage.types";
import { SubscriptionsPageHeader } from "@/components/subscriptions/SubscriptionsPageHeader";
import { SubscriptionsServiceTabs } from "@/components/subscriptions/SubscriptionsServiceTabs";
import { SubscriptionsToolbar } from "@/components/subscriptions/SubscriptionsToolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useFilteredSubscriptions } from "@/hooks/useFilteredSubscriptions";
import { LS_KEYS } from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";
import { groupByService, serviceKeyOf } from "@/lib/serviceGroups";
import {
  MEMBERS_SHEET,
  readImportFile,
  SUBSCRIPTIONS_SHEET,
  toSpreadsheetRows,
} from "@/lib/subscriptionTransfer";
import { toast } from "@/lib/toast";
import { categoriesService } from "@/services/categories";
import { currenciesService } from "@/services/currencies";
import { householdService } from "@/services/household";
import { paymentMethodsService } from "@/services/paymentMethods";
import { subscriptionMembersService } from "@/services/subscriptionMembers";
import { subscriptionsService } from "@/services/subscriptions";
import type { Subscription, SubscriptionMember } from "@/types";

export function SubscriptionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const [searchTerm, setSearchTerm] = useState("");
  const [sort] = useState<SubscriptionSortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<SubscriptionFiltersState>(INITIAL_SUBSCRIPTION_FILTERS);
  const [showForm, setShowForm] = useState(false);
  const [editSubscription, setEditSubscription] = useState<Subscription | null>(null);
  const [historySubscription, setHistorySubscription] = useState<Subscription | null>(null);
  const [membersSubscription, setMembersSubscription] = useState<Subscription | null>(null);
  const [detailSubscription, setDetailSubscription] = useState<Subscription | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [groupedByService, setGroupedByService] = useState(() => {
    try {
      return localStorage.getItem(LS_KEYS.GROUP_BY_SERVICE) === "1";
    } catch {
      return false;
    }
  });

  const toggleGroupedByService = () => {
    setGroupedByService((current) => {
      try {
        localStorage.setItem(LS_KEYS.GROUP_BY_SERVICE, current ? "0" : "1");
      } catch {
        // Storage unavailable (private mode): the choice lasts for this visit.
      }
      return !current;
    });
  };
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: queryKeys.subscriptions.all(userId),
    queryFn: () => subscriptionsService.list(userId),
    enabled: !!userId,
  });

  const { data: currencies = [] } = useQuery({
    queryKey: queryKeys.currencies.all(userId),
    queryFn: () => currenciesService.list(userId),
    enabled: !!userId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all(userId),
    queryFn: () => categoriesService.list(userId),
    enabled: !!userId,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: queryKeys.paymentMethods.all(userId),
    queryFn: () => paymentMethodsService.listForForm(userId),
    enabled: !!userId,
  });

  const { data: household = [] } = useQuery({
    queryKey: queryKeys.household.all(userId),
    queryFn: () => householdService.list(userId),
    enabled: !!userId,
  });

  const { data: members = [] } = useQuery({
    queryKey: queryKeys.subscriptions.members(userId),
    queryFn: () => subscriptionMembersService.list(userId),
    enabled: !!userId,
  });

  const membersBySubscription = useMemo(() => {
    const grouped: Record<string, SubscriptionMember[]> = {};
    for (const member of members) {
      (grouped[member.subscription] ??= []).push(member);
    }
    return grouped;
  }, [members]);

  const mainCurrency = currencies.find((currency) => currency.is_main);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionsService.delete(id),
    onSuccess: () => {
      toast.success(t("subscription_deleted"));
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.all(userId),
      });
      setDeleteId(null);
    },
    onError: () => toast.error(t("error_deleting_subscription")),
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => subscriptionsService.clone(id),
    onSuccess: () => {
      toast.success(t("success"));
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.all(userId),
      });
    },
    onError: () => toast.error(t("unknown_error")),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => subscriptionsService.renew(id),
    onSuccess: () => {
      toast.success(t("success"));
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.all(userId),
      });
    },
    onError: () => toast.error(t("unknown_error")),
  });

  const filteredSubscriptions = useFilteredSubscriptions({
    subscriptions,
    searchTerm,
    filters,
    sort,
    sortDir,
    disabledToBottom: user?.disabled_to_bottom,
  });

  // Tabs count every subscription so switching filters never hides a service.
  const serviceGroups = useMemo(() => groupByService(subscriptions), [subscriptions]);
  const visibleSubscriptions =
    serviceFilter === null
      ? filteredSubscriptions
      : filteredSubscriptions.filter((sub) => serviceKeyOf(sub) === serviceFilter);

  const handleExport = async (format: "json" | "xlsx") => {
    try {
      const data = await subscriptionsService.export();

      if (format === "json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "zublo-subscriptions.json";
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }

      const XLSX = await import("xlsx");
      const rows = toSpreadsheetRows(data.subscriptions);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(rows.subscriptions),
        SUBSCRIPTIONS_SHEET,
      );
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.members), MEMBERS_SHEET);
      XLSX.writeFile(workbook, "zublo-subscriptions.xlsx");
    } catch {
      toast.error(t("unknown_error"));
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    event.target.value = "";
    setIsImporting(true);

    try {
      const importedSubscriptions = await readImportFile(file);

      if (!importedSubscriptions) {
        toast.error(t("import_invalid_format"));
        return;
      }

      const result = await subscriptionsService.import(importedSubscriptions);
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.all(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.members(userId),
      });

      const summary =
        result.skipped > 0
          ? t("import_partial", { imported: result.imported, skipped: result.skipped })
          : t("import_success", { count: result.imported });
      const members = result.members_imported ?? 0;
      toast.success(members > 0 ? `${summary} · ${t("import_members", { count: members })}` : summary);
    } catch {
      toast.error(t("import_error"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleCycleSort = () => {
    setSortDir((current) => (current === "asc" ? "desc" : "asc"));
  };

  const handleCreate = () => {
    setEditSubscription(null);
    setShowForm(true);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditSubscription(subscription);
    setShowForm(true);
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 space-y-6 fade-in duration-500">
      <SubscriptionsPageHeader
        importInputRef={importInputRef}
        isImporting={isImporting}
        onImportChange={handleImportFile}
        onExport={handleExport}
        onCreate={handleCreate}
      />

      <SubscriptionsToolbar
        searchTerm={searchTerm}
        showFilters={showFilters}
        view={view}
        onSearchChange={setSearchTerm}
        onToggleFilters={() => setShowFilters((current) => !current)}
        onCycleSort={handleCycleSort}
        onViewChange={setView}
      />

      {serviceGroups.length > 0 ? (
        <SubscriptionsServiceTabs
          groups={serviceGroups}
          total={subscriptions.length}
          selected={serviceFilter}
          grouped={groupedByService}
          onSelect={setServiceFilter}
          onToggleGrouped={toggleGroupedByService}
        />
      ) : null}

      {showFilters ? (
        <SubscriptionsFiltersPanel
          categories={categories}
          filters={filters}
          onChange={setFilters}
        />
      ) : null}

      <SubscriptionsGrid
        isLoading={isLoading}
        subscriptions={visibleSubscriptions}
        groupByService={groupedByService}
        layout={view}
        mainCurrency={mainCurrency}
        convertCurrency={user?.convert_currency}
        showMonthly={user?.monthly_price}
        showProgress={user?.subscription_progress}
        onEdit={handleEdit}
        onClone={(id) => cloneMutation.mutate(id)}
        onRenew={(id) => renewMutation.mutate(id)}
        onHistory={setHistorySubscription}
        onMembers={setMembersSubscription}
        onDelete={setDeleteId}
        onOpen={setDetailSubscription}
        membersBySubscription={membersBySubscription}
      />

      {showForm ? (
        <SubscriptionFormModal
          sub={editSubscription}
          userId={userId}
          currencies={currencies}
          categories={categories}
          paymentMethods={paymentMethods}
          household={household}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            queryClient.invalidateQueries({
              queryKey: queryKeys.subscriptions.all(userId),
            });
          }}
        />
      ) : null}

      {historySubscription ? (
        <SubscriptionHistoryDialog
          sub={historySubscription}
          userId={userId}
          onClose={() => setHistorySubscription(null)}
        />
      ) : null}

      {detailSubscription ? (
        <SubscriptionDetailDialog
          sub={detailSubscription}
          userId={userId}
          members={membersBySubscription[detailSubscription.id] ?? []}
          onClose={() => setDetailSubscription(null)}
          onEdit={() => {
            setDetailSubscription(null);
            handleEdit(detailSubscription);
          }}
          onMembers={() => {
            setDetailSubscription(null);
            setMembersSubscription(detailSubscription);
          }}
          onHistory={() => {
            setDetailSubscription(null);
            setHistorySubscription(detailSubscription);
          }}
        />
      ) : null}

      {membersSubscription ? (
        <SubscriptionMembersDialog
          sub={membersSubscription}
          userId={userId}
          members={membersBySubscription[membersSubscription.id] ?? []}
          onClose={() => setMembersSubscription(null)}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(nextOpen) => !nextOpen && setDeleteId(null)}
        title={t("delete_subscription")}
        description={t("confirm_delete_subscription")}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
