/// <reference path="../pb_data/types.d.ts" />

// ================================================================
// CRON 10: Credit wallet reminders
// ================================================================
// Hourly, like member expiry reminders: for every wallet with alerts on,
// forecast when its balance runs out (see lib/pure/credit-forecast.js) and
// remind the owner on each reminder slot whose days match the days left.
cronAdd("sendCreditNotifications", "0 * * * *", () => {
  const dateHelpers = require(__hooks + "/lib/date-helpers.js");
  const credit = require(__hooks + "/lib/pure/credit-forecast.js");
  const { normalizeReminderSlots } = require(__hooks + "/lib/pure/reminder-slots.js");
  const notifHelpers = require(__hooks + "/lib/notifications.js");
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = dateHelpers.formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

  let wallets = [];
  try {
    wallets = $app.findRecordsByFilter("credit_wallets", "alerts = true", "", 0, 0);
  } catch (e) {
    console.log("[Zublo] credit wallet lookup error:", e);
    return;
  }

  const findRecord = (cache, collection, id) => {
    if (!id) return null;
    if (!(id in cache)) {
      try {
        cache[id] = $app.findRecordById(collection, id);
      } catch (_) {
        cache[id] = null;
      }
    }
    return cache[id];
  };
  const currencyCache = {};
  const cycleCache = {};

  let sent = 0;
  for (const wallet of wallets) {
    const userId = wallet.getString("user");

    let notifConfig;
    try {
      const configs = $app.findRecordsByFilter(
        "notifications_config", "user = {:userId}", "", 1, 0, { userId: userId }
      );
      if (configs.length === 0) continue;
      notifConfig = configs[0];
    } catch (_) {
      continue;
    }

    // getString, not get(): see sendMemberExpiryNotifications.
    let reminders = [{ days: 3, hour: 8 }];
    try {
      reminders = normalizeReminderSlots(notifConfig.getString("reminders"));
    } catch (_) {}
    const dueReminders = reminders.filter((r) => Number(r.hour) === currentHour);
    if (dueReminders.length === 0) continue;

    let walletCurrency = findRecord(currencyCache, "currencies", wallet.getString("currency"));
    if (!walletCurrency) {
      try {
        const mains = $app.findRecordsByFilter(
          "currencies", "user = {:uid} && is_main = true", "", 1, 0, { uid: userId }
        );
        walletCurrency = mains[0] || null;
      } catch (_) {}
    }
    const walletRate = walletCurrency ? walletCurrency.getFloat("rate") : 1;
    const symbol = walletCurrency ? walletCurrency.getString("symbol") : "";

    const account = wallet.getString("account");
    const subscriptions = $app
      .findRecordsByFilter("subscriptions", "user = {:uid}", "", 0, 0, { uid: userId })
      .filter((sub) => credit.matchesAccount(sub.getString("payment_account"), account))
      .map((sub) => {
        const cycle = findRecord(cycleCache, "cycles", sub.getString("cycle"));
        const currency = findRecord(currencyCache, "currencies", sub.getString("currency"));
        const subRate = currency && !currency.getBool("is_main") ? currency.getFloat("rate") : 1;
        return {
          id: sub.id,
          name: sub.getString("name"),
          amount: credit.convertAmount(sub.getFloat("price"), subRate, walletRate),
          cycle: cycle ? cycle.getString("name") : "",
          frequency: sub.getInt("frequency"),
          next_payment: sub.getString("next_payment"),
          start_date: sub.getString("start_date"),
          end_date: sub.getString("end_date"),
          cancellation_date: sub.getString("cancellation_date"),
          inactive: sub.getBool("inactive"),
          record_type: sub.getString("record_type"),
        };
      });

    const entries = $app
      .findRecordsByFilter("credit_entries", "wallet = {:wid}", "", 0, 0, { wid: wallet.id })
      .map((entry) => ({
        type: entry.getString("type"),
        amount: entry.getFloat("amount"),
        date: entry.getString("date"),
        created: entry.getString("created"),
      }));
    if (entries.length === 0) continue;

    const forecast = credit.forecastWallet({ entries: entries, subscriptions: subscriptions, today: todayStr });
    if (forecast.daysLeft === null) continue;

    for (const reminder of dueReminders) {
      const days = Number(reminder.days);
      if (!isFinite(days) || forecast.daysLeft !== days) continue;
      const reminderKey = "credit_" + days + "d_" + currentHour + "h";

      try {
        const existing = $app.findRecordsByFilter(
          "notification_log",
          "subscription_id = {:sid} && user_id = {:uid} && reminder_key = {:key} && sent_date = {:date}",
          "", 1, 0, { sid: wallet.id, uid: userId, key: reminderKey, date: todayStr }
        );
        if (existing.length > 0) continue;
      } catch (_) {}

      const alert = credit.creditAlertMessage(
        { name: wallet.getString("name"), account: account }, forecast, symbol
      );
      notifHelpers.dispatchToAllProviders($app, notifConfig, alert.title, alert.message, [
        { id: wallet.id, name: wallet.getString("name"), runOutDate: forecast.runOutDate, balance: forecast.balance },
      ]);
      sent++;

      try {
        const log = new Record($app.findCollectionByNameOrId("notification_log"));
        log.set("subscription_id", wallet.id);
        log.set("user_id", userId);
        log.set("reminder_key", reminderKey);
        log.set("sent_date", todayStr);
        $app.save(log);
      } catch (e) {
        console.log("[Zublo] credit log write error:", e);
      }
    }
  }

  console.log("[Zublo] sendCreditNotifications: sent " + sent + " for hour " + currentHour);
});
