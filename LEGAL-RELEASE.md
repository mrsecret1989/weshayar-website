# Legal pages and store release readiness

Prepared 2026-10-22 from the current app/server source and official store policies. These are Sorani pre-launch drafts, not a certification of legal compliance or store acceptance.

## Owner-provided facts

- Operator: Hima Digital Co.
- Location: Kurdistan Region, Iraq.
- Contact: contact@pelepit.com (owner corrected the original spelling).
- Audience: 13 and older (owner, 2026-11-02). Not designed for children under 13.
- Default privacy request acknowledgement/response target: 30 days, not a promise that every deletion is completed within that period.

## Pages

- `/privacy`: app and website privacy, public profile photos, device/IP diagnostics, support, Firebase, ads, notifications, purchases and deletion.
- `/terms`: game rules, coins/tickets, store purchases, refunds subject to statutory rights, computer opponents, conduct, intellectual property and complaints.
- `/delete-account`: in-app deletion and an external email request route. The owner must verify the mailbox exists and is monitored before using this URL for Play Console.
- Published without a draft banner and indexable (owner, 2026-11-02). Written from the code, not reviewed by a lawyer.

## Release blockers — text cannot substitute for implementation

1. **Audience.** 13+: the store forms must say the same (target age 13+, not directed to children). Google may still judge that the art appeals to children.
2. **Public content.** Names and uploaded photos are visible to other players (`accounts.ts`, `player_photos.dart`). Review moderation, reporting, blocking and child-safe profile handling. Avoid publishing a claim that private photos are never shared.
3. **Retention.** Local backup script defaults to 14 days. Off-site script commits encrypted backups to Git: removing current files after 30 days does not remove Git history. Establish and implement a finite retention/deletion policy covering historical objects and restores before removing the draft warning. Do not rewrite/delete backup history as part of this website task.
4. **SDK data deletion.** Account purge removes Nakama account data but code does not demonstrate a Firebase Analytics/Crashlytics user deletion workflow or per-service retention settings. Review and implement requests with each processor; inventory logs, purchase validation records and lawful exceptions. Publish the actual retention periods only after verified.
5. **Contacts and external route.** Verify contact@pelepit.com receives mail and has a monitored workflow, identity verification, request tracking and response SLA. The external page sends email, not an automated API deletion. No emails were sent during this task.
6. **App links.** `apps/mobile/lib/app/links.dart` still uses build-time `PRIVACY_URL`, `TERMS_URL`, `SUPPORT_EMAIL`. For release configure `https://pelepit.com/privacy`, `https://pelepit.com/terms`, `contact@pelepit.com`. No Flutter code changed in this task. Link privacy in both app and store metadata; provide `https://pelepit.com/delete-account` in Play Console after the operational workflow is ready.
7. **Store declarations.** Complete Data safety/App Privacy from the final binary and actual SDK console configuration: identifiers, email/phone, public photo, support content, gameplay, purchase history/validation, diagnostics, IP, analytics, push tokens and advertising data. Do not claim that pseudonymous user IDs are fully anonymous. No store declarations were submitted.
8. **Purchases and competition.** Verify real store products, receipts/refund notifications and sandbox behavior; current design uses consumable coin packs, no subscriptions. Disclose computer opponents in the game before affected play, not only in legal text. Review entry fees, bot-funded prizes, purchased virtual currency and age-rating/simulated-gambling implications against store rules and local law. This task does not certify those mechanics.
9. **Operational facts.** Confirm hosting locations, processor agreements, international transfers, legal entity details and any legally required service address. Code alone cannot verify them. Legal review for actual launch territories is still needed.

## Source mapping

- `apps/mobile/lib/integrations/firebase/analytics_sink.dart`, `crash_reporter.dart`: product events and server user IDs.
- `apps/mobile/lib/integrations/ads/admob_rewarded_ads.dart`: UMP and rewarded ads.
- `apps/mobile/lib/features/profile/profile_controller.dart`, `account_card.dart`, `player_photos.dart`: contact linking, photos and deletion.
- `server/nakama/modules/src/accounts.ts`: Resend/Twilio, public photos, purge.
- `server/nakama/modules/src/support.ts`, `reports.ts`: support/report content and device/IP.
- `docs/decisions/0024-crash-reports-analytics-notifications.md`: push and analytics.
- `docs/decisions/0031-store-purchases.md`, `0032-bots-in-duels-and-leagues.md`, `0034-admin-tools-support-and-device-info.md`.
- `server/nakama/scripts/backup.sh`, `backup-offsite.sh`: retention limits and history caveat.

## Official references checked

- https://support.google.com/googleplay/android-developer/answer/10144311
- https://support.google.com/googleplay/android-developer/answer/13327111
- https://support.google.com/googleplay/android-developer/answer/9893335
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/support/offering-account-deletion-in-your-app/
- https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/
