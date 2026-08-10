# Teryaq Dashboard

أريد بناء Frontend جديد بالكامل لنظام صيدلية باسم:



Teryaq



هذا المشروع هو إعادة تصميم شاملة للواجهة UI/UX لتطبيق موجود بالفعل.



مهم جداً:

يوجد Backend/API قائم ويعمل ومتصل بقاعدة بيانات Almohaseb 3 / SQL Server.

لا تنشئ Backend جديد.

لا تنشئ قاعدة بيانات.

لا تستخدم Supabase.

لا تنشئ Authentication الآن.

لا تعِد بناء المنطق المحاسبي.

المطلوب في هذه المرحلة هو Frontend + Design System فقط.



Architecture



The final architecture will be:



Almohaseb 3 / SQL Server

↓

Existing Teryaq SQL Connector API

↓

This new Lovable Frontend



Create a centralized API layer so that later all endpoints are consumed from one configurable base URL.



Use:



VITE_API_BASE_URL



Do not hard-code localhost, IP addresses, or production domains inside components.



Create a clean API client architecture that can later consume endpoints such as:



/api/status

/api/revenue-details

/api/trading-profit

/api/customers

/api/suppliers

/api/items/stock

/api/items/track

/api/items/out-of-stock

/api/items/expiry

/api/invoices/sales/:movementNo

/api/invoices/purchases/:movementNo



Do not implement or invent API responses yet.



For this first phase, use clearly marked mock/demo data only for visual development.



---



PRIMARY GOAL



I am not satisfied with the UI/UX of the old application.



The new interface must feel like a modern professional pharmacy/ERP mobile application.



Design priorities:



- Arabic RTL first.

- Mobile-first.

- Very fast visual scanning.

- Compact information density.

- Minimal scrolling.

- Professional financial dashboard style.

- Clean white/light surfaces.

- Modern typography.

- Clear hierarchy.

- Subtle shadows.

- Rounded cards, but not oversized cards.

- Avoid huge empty spaces.

- Avoid giant buttons/cards.

- Avoid excessive gradients.

- Avoid childish colors.

- Avoid clutter.

- Avoid dashboard cards stacked one under another on mobile.



Use Cairo or an equivalent high-quality Arabic font.



---



APP SHELL



Build the main application shell.



Top header should contain:



- Teryaq logo/wordmark

- Database connection status as a compact indicator

- Example:

  AlmohasebSQL ✓

- Green when connected

- Red when disconnected

- Small profile/settings action if needed



Do NOT create a large connection-status card.



Navigation must be simple and optimized for mobile.



Use a bottom navigation bar for the primary destinations.



Suggested primary navigation:



1. الرئيسية

2. الإيرادات

3. الحسابات

4. الأصناف

5. المزيد



Do not show multiple back buttons.

Each screen should have only one clear navigation hierarchy.



---



HOME DASHBOARD



Design the new Home Dashboard.



Important:

This phase is UI design only.



Top section:



A compact greeting/header:

"نظرة عامة"



Do not waste vertical space with large titles.



Then create a compact 2-column KPI grid.



Visual reference:

modern lightweight financial dashboard cards.



Each card should contain:



- small icon

- muted label

- large bold value

- optional tiny secondary text



Cards should be relatively short.



Demo KPIs:



- إيراد اليوم

- أرباح اليوم

- عدد الحركات

- أرصدة الزبائن



Second row:



- مستحقات الموردين

- أصناف منخفضة المخزون

- أصناف نفدت

- قرب انتهاء الصلاحية



These are demo values only at this stage.



Do not create very tall cards.



---



QUICK ACTIONS



Below dashboard KPIs create a compact Quick Actions section.



Actions:



- إيراد اليوم

- حسابات الزبائن

- حسابات الموردين

- المخزون

- تتبع صنف

- المتاجرة والأرباح



Use small icon tiles, preferably 3 columns on normal mobile widths where readable.



---



ITEMS STRUCTURE



Prepare navigation structure for:



الأصناف



When opened it will eventually contain:



- المخزون

- تتبع صنف

- أصناف نفدت

- قرب الانتهاء



Do not implement full functionality in this phase.

Create only polished navigation cards/screens.



---



ACCOUNTS STRUCTURE



Prepare:



الحسابات



Then selection:



- الزبائن

- الموردين



Again, visual shell only for now.



---



DESIGN SYSTEM



Create reusable components rather than page-specific duplicated CSS.



At minimum:



- AppHeader

- BottomNavigation

- PageHeader

- KPIGrid

- KPICard

- CompactListCard

- SectionHeader

- SearchInput

- StatusBadge

- EmptyState

- LoadingState

- ErrorState

- FilterBar

- DateRangeControl

- ActionButton

- SegmentedTabs



Use CSS/Tailwind tokens consistently.



Define spacing and typography rules.



Keep mobile horizontal padding around 12–16px.



Avoid excessive vertical padding.



---



RESPONSIVE



Primary target:

Android phone.



Also support:



- tablets

- laptop/desktop



Desktop should not simply stretch mobile cards across a huge screen.



Use reasonable max-width containers and adaptive grids.



---



VISUAL QUALITY



The interface should look production-ready, not like a generated admin template.



I want:



- restrained professional colors

- excellent RTL alignment

- precise spacing

- consistent icon sizing

- readable numbers

- financial values visually dominant

- labels visually secondary



Use icons consistently from Lucide.



Do not use emojis as UI icons.



---



IMPORTANT RESTRICTIONS



Do not:



- build Supabase

- create database schema

- create backend functions

- create authentication

- modify accounting logic

- invent SQL

- add APIs that do not exist

- create fake business logic



Demo data is allowed only for UI preview and must be isolated so it can later be replaced by the real API.



---



DELIVERABLE FOR PHASE 1 ONLY



Build:



1. Global Design System

2. Application Shell

3. Bottom Navigation

4. New Home Dashboard

5. Accounts navigation shell

6. Items navigation shell

7. Revenue navigation shell

8. API client/config structure ready for later connection



Stop after Phase 1.



Do not start building detailed business screens yet.



After completing Phase 1, summarize:



- components created

- routes created

- design tokens/components

- API architecture created

- files changed



Then wait for my next instruction.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/74d274e2-40af-476b-97ed-453c0ed7f592).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
