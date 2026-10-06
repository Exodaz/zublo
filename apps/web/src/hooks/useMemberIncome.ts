import { useQuery } from "@tanstack/react-query";

import { toIsoDate } from "@/lib/dateInput";
import { type MemberIncomeSummary, memberIncomeSummary } from "@/lib/memberIncome";
import { queryKeys } from "@/lib/queryKeys";
import { memberPaymentsService } from "@/services/memberPayments";
import { subscriptionMembersService } from "@/services/subscriptionMembers";
import { subscriptionsService } from "@/services/subscriptions";

/** Member income for the dashboard; undefined until loaded or when there are no members. */
export function useMemberIncome(userId: string): { data?: MemberIncomeSummary; isLoading: boolean } {
  const enabled = !!userId;
  const members = useQuery({
    queryKey: queryKeys.subscriptions.members(userId),
    queryFn: () => subscriptionMembersService.list(userId),
    enabled,
  });
  const payments = useQuery({
    queryKey: queryKeys.subscriptions.allMemberPayments(userId),
    queryFn: () => memberPaymentsService.listForUser(userId),
    enabled,
  });
  const subscriptions = useQuery({
    queryKey: queryKeys.subscriptions.all(userId),
    queryFn: () => subscriptionsService.list(userId),
    enabled,
  });

  const isLoading = members.isLoading || payments.isLoading || subscriptions.isLoading;
  if (!members.data?.length || !payments.data || !subscriptions.data) return { isLoading };
  return {
    isLoading,
    data: memberIncomeSummary({
      members: members.data,
      payments: payments.data,
      subscriptions: subscriptions.data,
      today: toIsoDate(new Date()),
    }),
  };
}
