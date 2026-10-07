FreeSpot Project Context
Last updated: 2026-10-07
Purpose of this file
This file gives Codex the product, architecture, business-logic, database, and workflow context for FreeSpot.
Before starting any task, read this file together with AGENTS.md.
Important:
- Repository review date: 2026-10-07. This review inspected code only; it did not query live Supabase or rerun end-to-end QA.
- Status labels: "Verified in repository" describes code behavior; "Planned / not implemented yet" describes future requirements; "Requires live Supabase verification" describes unverified database/auth configuration or enforcement.
- Supabase calls show what the application requests, not proof of live schema, grants, RLS policies, or RPC implementation.
- The actual codebase and live Supabase schema are the final source of truth.
- If this file conflicts with the code or database, stop and report the mismatch before making changes.
- Do not silently "fix" architecture or business logic based only on assumptions.
- Work on one focused task at a time.
1. Product Overview
FreeSpot is a marketplace for last-minute appointment availability.
The core problem:
Businesses frequently get cancellations or unused appointment slots. Those empty slots create lost revenue, while customers may be looking for an appointment immediately or within a short time window.
FreeSpot connects these two sides.
Customer experience
Verified in repository:
- Text search matches service, business name, and area.
- Category filtering and optional business filtering through the home page's business query parameter are implemented.
- Preferred area and categories prioritize results; they do not restrict results to that area.
- Published, available, future appointments are requested from Supabase.
Planned / not implemented yet:
- Time-window, price, explicit area selection, and distance/radius filters.
- Today / tomorrow / this week / next hour filtering.
- The visible quick-filter buttons and filters button currently have no action handlers.
The current customer UI provides:
- Browse available appointments
- View appointment details
- See the business address where available
- Open navigation
- Favorite appointments and businesses separately
- Book appointments
- View their bookings
- View saved businesses at /saved-businesses
Planned / not implemented yet: saved searches and matching notifications.
Customer phone privacy requirement: expose phone numbers only to businesses with a relevant booking relationship. Enforcement: Requires live Supabase verification.
Business experience
Businesses can:
- Register as a business
- Maintain a business profile
- Define/select the services they offer
- Publish a newly available appointment slot
- Set a FreeSpot price/discount
- Manage appointments
Planned / not implemented yet: customer management and additional business activity.
The business experience should remain separate from the customer experience.
2. Brand
Product name:
FreeSpot
Chosen slogan:
מוצאים לך תור פנוי, ברגע הנכון
Use this slogan consistently where relevant, especially around login/branding.
The application UI is primarily Hebrew and RTL.
3. Product Philosophy
Treat FreeSpot as the first version of a real business, not as a demo project.
Product and technical decisions should consider:
- Product-market fit
- Customer pain
- Business pain
- Differentiation
- Monetization
- Go-to-market
- Validation
- Scalability
- Security
- Maintainability
Do not over-engineer the MVP, but do not build insecure shortcuts that will be difficult to remove later.
4. Technology Stack
Current stack:
- Next.js
- App Router
- TypeScript
- React
- Supabase
  - Authentication
  - Database table queries and RPC/database function calls
  - Live PostgreSQL schema, Row Level Security, and RPC enforcement: Requires live Supabase verification
- lucide-react
- Tailwind CSS 4
- Git / GitHub
- Vercel (historical deployment context; current deployment not verified in this repository review)
Verified in repository architecture:
- Next.js 16.3.6, React 19.2.8, App Router, and TypeScript.
- app/ contains routes; components/ contains separate Customer and Business navigation.
- lib/supabase/client.ts creates the browser client; server.ts creates the server client with cookies.
- proxy.ts delegates session refresh and role redirects to lib/supabase/proxy.ts.
- Most application pages are Client Components calling Supabase directly.
- /auth/callback is the only current Route Handler; business operations have no local API route or Server Action layer.
- No Supabase Realtime subscriptions exist in the current code. Open pages do not automatically receive other users' booking or availability changes.
The project should remain on a low-cost / free stack where practical during the MVP phase.
5. Authentication and Account Types
The chosen authentication flow is LOGIN-FIRST.
Initial screen
The first authentication screen is Login:
- Email
- Password
- "Not registered yet? Sign up"
From signup, the user chooses an account type:
- Customer
- Business
Customer signup fields
The /auth/signup/customer form includes:
- First name
- Last name
- Email
- Password
- Phone
Customer onboarding is separate from signup:
- After email verification, /auth/verified checks profiles.onboarding_completed.
- Incomplete customer onboarding redirects to /onboarding/customer.
- That page collects preferred area and at least one preferred category, then updates profiles.preferred_area, preferred_categories, onboarding_completed, and updated_at.
Customer phone privacy is important:
The phone number should not be openly exposed to unrelated businesses.
Enforcement: Requires live Supabase verification.
Business signup fields
Business registration includes:
- Owner first name and last name
- Business name
- Business/service category
- Exact address
- City
- Email
- Password
- Contact phone
- Optional business description
Email verification
Verified in repository: signup uses signUp with emailRedirectTo pointing to /auth/callback; login uses signInWithPassword.
Email-confirmation settings, allowed redirect URLs, email delivery, and session behavior in the live project: Requires live Supabase verification.
Implemented route flow:
1. User signs up.
2. User sees a "check your email" state/page.
3. Supabase confirmation link returns through a callback route.
4. The callback confirms the session.
5. The user is routed into the appropriate onboarding/application flow.
Known routes include authentication callback / verified / onboarding routes. Always inspect the current route structure before modifying them.
Auth limitations verified in repository:
- Signup sends role and user/business details in auth metadata; the code expects profiles and businesses records but does not define their creation mechanism. Triggers and metadata-to-table behavior: Requires live Supabase verification.
- /auth/callback uses exchangeCodeForSession and redirects to /auth/verified on success.
- Regular login and Proxy redirects do not check onboarding_completed; incomplete onboarding is not enforced across customer routes.
- Business accounts go to /business/pending after verification; verified businesses are then redirected to /business.
- No password-reset flow is implemented.
6. Customer and Business Separation
Customer and Business are two separate experiences under the same authentication system.
Do not collapse them into a single generic interface.
Business routes are under:
/business/*
Customer routes live outside the business namespace.
The account role is used to determine which experience the authenticated user should receive.
The role has been stored in profiles.role.
The project also has business verification logic. Business verification should be treated separately from the account role.
Verified in repository:
- Unauthenticated application requests redirect to /auth; auth routes remain accessible for callback/verification.
- profiles.role === "customer" redirects away from /business; "business" redirects away from customer routes.
- Business pages query businesses by owner_id and check verification_status === "verified" before allowing their normal UI flow.
Current limitations:
- Proxy lets the request continue when the profiles query fails. Missing profiles and unknown roles also do not trigger its role-based restrictions.
- The business dashboard still shows "מעבר לצד הלקוח", pointing to /; Proxy redirects that business account back to /business.
- Route redirects and client-side ownership checks do not establish database authorization. Enforcement: Requires live Supabase verification.
7. Business Navigation
Verified in repository: components/business/BusinessBottomNav.tsx provides:
- Dashboard: /business
- Appointments: /business/appointments
- Publish: /business/appointments/new
- Services: /business/services
- Profile: /business/profile
Planned / not implemented yet: Customers navigation and customer management.
Do not introduce new navigation structure without checking the current implementation and product direction.
8. Core Data Model
Important database concepts currently used in FreeSpot include:
profiles
Used for user profile/account information.
Important concept:
- role distinguishes Customer vs Business.
The code reads role, first_name, onboarding_completed, preferred_area, and preferred_categories, and updates onboarding preferences.
Exact schema, constraints, account creation, role mutation permissions, and phone privacy: Requires live Supabase verification.
businesses
Stores business data.
Relevant concepts include:
- Business name
- Category
- Address
- City / location information
- Verification state
The code uses owner_id and verification_status. /business/profile updates description and instagram_url directly through Supabase; /b/[id] can display the Instagram link.
Historical report: a temporary manual verification flow was created for testing. Its existence and permissions: Requires live Supabase verification.
appointments
Represents appointment slots published by businesses.
Important concepts include:
- Business relationship
- Service relationship
- Appointment time
- Duration
- Price
- Previous/regular price where relevant
- Availability/status
- Publishing state
- Booking state
Appointment creation has been moved away from arbitrary client inserts toward controlled RPC/database logic.
Verified in repository: creation calls create_my_appointment_from_service; unpublishing calls unpublish_my_appointment. No direct appointment INSERT is present in application code.
Lists use starts_at, is_available, and is_published. The Business appointments screen groups active, booked, and history items; its booked group is based on !is_available rather than a bookings lookup.
The appointment details page does not select/check is_published before showing booking availability; it checks is_available and whether starts_at has passed.
Database rejection of unpublished appointments and consistency between availability and bookings: Requires live Supabase verification.
service_templates
Created to provide predefined/category-based service templates.
Historical report: templates were seeded for categories including examples such as:
- Haircut
- Nails
- Eyebrows
- Cosmetics
Verified in repository: the services page queries active templates matching the business category, ordered by sort_order, and groups them by service_group.
Exact current seed values and schema: Requires live Supabase verification.
business_services
Represents the actual services offered by a specific business.
The service-driven publishing flow uses business_services rather than allowing the business to type arbitrary service details for every appointment.
The selected business service supplies values such as:
- Service identity/name
- Duration
- Regular price
Verified in repository: /business/services inserts and updates business_services directly from the browser, including duration_minutes, price, and is_active. Publishing loads active business services and resolves names from service_templates.
Ownership enforcement, category consistency, constraints, and mutation permissions: Requires live Supabase verification.
favorites
Used for customer favorites.
Known structure includes:
- id
- user_id
- appointment_id
- created_at
Important:
Verified in repository: favorites points to appointments; /favorites loads favorites and merges appointment details. Browser writes insert/delete records with user_id and appointment_id.
RLS enablement, active policies, grants, unique constraints, and cross-user isolation: Requires live Supabase verification.
business_favorites
Verified in repository: /b/[id] saves/removes businesses using user_id and business_id in business_favorites.
/saved-businesses loads get_my_favorite_businesses and removes saved records directly from business_favorites. Customer navigation links to this screen separately from /favorites.
Exact schema, RPC result, RLS policies, grants, and cross-user isolation: Requires live Supabase verification.
bookings
Represents customer bookings.
Booking creation/cancellation is controlled through database/RPC logic rather than arbitrary client writes where possible.
Verified in repository: creation calls book_appointment; cancellation calls cancel_my_booking; customer bookings and the success page use get_my_bookings; the business dashboard uses get_my_business_bookings.
The details page also reads bookings directly to detect an existing confirmed booking for the current user and appointment.
RPC definitions/grants, RLS, prevention of duplicate or concurrent bookings, ownership checks, cancellation rules, and resulting appointment availability: Requires live Supabase verification.
The business dashboard displays customer_phone returned with booking data; the RPC's relationship filtering and other routes to phone data: Requires live Supabase verification.
9. Appointment Publishing Architecture
The current intended publishing flow is SERVICE-DRIVEN.
A business should not manually enter all service properties from scratch each time.
Verified in repository UI flow:
1. Load the authenticated business.
2. Load that business's available business_services.
3. Business chooses one service.
4. Duration and regular price come from the selected business service.
5. Business chooses date/time.
6. Business may optionally apply a FreeSpot discount.
7. The UI calls create_my_appointment_from_service with p_business_service_id, p_starts_at, optional p_freespot_price, and optional p_description.
8. The UI redirects to /business/appointments after a successful RPC response.
Actual appointment creation, populated appointments.business_service_id, server-side price/duration validation, and current RPC permissions: Requires live Supabase verification.
Historical report: this flow passed end-to-end QA; that QA was not rerun in the repository review.
Previously reported successful QA:
- Business services load according to the business category.
- Selected service supplies duration.
- Selected service supplies regular price.
- Optional FreeSpot discount works.
- Published appointment appears in the customer experience.
- appointments.business_service_id is populated.
These historical runtime/database outcomes are not established by code inspection. Database outcomes: Requires live Supabase verification.
Do not regress this flow back to free-text appointment creation.
10. Appointment Creation Security
Verified in repository: appointment creation uses the service-driven RPC; application code contains no direct appointment INSERT and no call to the legacy create_my_appointment RPC.
Historical SQL work reported as completed:
SQL 22 - Force appointment creation through RPC
Direct INSERT access on:
public.appointments
was revoked from:
- anon
- authenticated
Historical report: this was run successfully. Current direct INSERT permissions: Requires live Supabase verification.
The intent is that appointment creation must go through an approved RPC/database function.
Legacy RPC
Legacy free-text RPC:
create_my_appointment(...)
was identified in prior context as needing authenticated access revoked. Whether it still exists or is accessible: Requires live Supabase verification.
Inspect live definitions and effective permissions before deciding whether revocation is still needed.
The legacy RPC should not remain an alternative path that bypasses the new service-driven flow.
Preferred RPC
The newer service-driven RPC is:
create_my_appointment_from_service(...)
This is the preferred appointment creation path.
Current implementation, grants, security mode, and ownership/business-rule enforcement: Requires live Supabase verification.
Authenticated businesses should continue to use this controlled path.
Before changing RPC permissions:
- Inspect the current SQL definition.
- Inspect current grants.
- Inspect all code references.
- Confirm the application is no longer dependent on the legacy RPC.
11. Historical SQL Work (Not Verified from Repository)
No SQL definitions or migrations were found in the repository review. The following numbering/statuses are historical reports, not verified current database state.
22 - Force appointment creation through RPC
Purpose:
Revoke direct appointment inserts and force controlled appointment creation.
Status:
Historical report: completed successfully. Current grants: Requires live Supabase verification.
23 - Create service templates and business services
Purpose:
- Create service_templates
- Create business_services
- Seed category-specific service templates
- Add relevant RLS/grants
Status:
Historical report: completed and tested from the application. Current schema, seeds, RLS, and grants: Requires live Supabase verification.
24 - Manually verify business
Purpose:
Temporary admin/testing helper to mark a business as verified.
Status:
Historical report: created for development/testing. Current helper definition/access: Requires live Supabase verification.
Important:
This temporary verification helper is not necessarily the final production verification architecture.
When adding new SQL work, continue using clear descriptive names/numbers where appropriate.
12. Business Verification
Verified in repository: business pages check verification_status and redirect non-verified businesses to /business/pending. The customer business page requests only verified businesses.
The pending page does not distinguish pending and rejected businesses in its messaging.
Historical temporary manual verification mechanism: Requires live Supabase verification. No admin verification UI exists in the repository.
Do not assume the temporary verification solution is the final production design.
Planned / not implemented yet: a production verification system, to be designed separately.
13. Favorites
Verified in repository: appointment favorites and business favorites use Supabase-backed reads/writes. No localStorage or sessionStorage use for favorites or bookings was found in current application code.
Reason:
A previous behavior caused favorites to remain visible/persist incorrectly around logout/session changes.
The intended behavior is:
- Favorites are user-specific.
- Data should be protected with RLS.
- One user should not be able to read/write another user's favorites.
Historical report: RLS was enabled on favorites-related data. Current enablement, active policies, and effective permissions: Requires live Supabase verification.
Important:
Because schema/migrations may not all exist in the Git repository, always verify the exact live RLS policies in Supabase before claiming they are complete.
Do not rely only on UI filtering for authorization.
14. Booking Flow
A customer can open an appointment, review details, accept terms, and book it.
Appointment details have included:
- Service/business information
- Time
- Price
- Location
- Exact address where available
- Navigation link
- Description
- Booking/cancellation policy messaging
- Already-booked state
Verified in repository: no payment integration is implemented; the appointment UI explicitly says FreeSpot does not currently charge payment.
Planned / not implemented yet: deposit/cancellation/no-show terms described as future additions in the UI. Any payment integration requires an explicit product decision.
Do not introduce payment behavior without an explicit product decision.
15. Location
Location is important to FreeSpot.
Verified in repository:
- Business signup collects city and an exact address text field.
- Appointment details show address where available and link to Google Maps navigation/search.
- Home search can match area text; preferred area affects result ordering.
- Home location controls and the customer profile currently show hardcoded "רמת גן" and do not change location.
- No geolocation acquisition, coordinate-based distance calculation, radius filtering, or nearby-business retrieval is implemented.
- The distance field is read/displayed; no calculation is implemented in application code. Its live source/accuracy: Requires live Supabase verification.
Planned / not implemented yet:
- Nearby businesses
- Explicit area/location selection and filtering
- Radius/geolocation filtering
A previous request explicitly required "עסקים באזור" to retrieve nearby businesses.
Do not replace exact location requirements with only city/area text.
16. Known UX / Technical Issues From Development
Issues previously encountered include:
Hydration mismatch
Hydration mismatch warnings were seen in the web application.
If hydration issues reappear:
- Identify server/client rendering differences.
- Avoid hiding the warning without fixing the cause.
setState in effect warning
A warning related to setState inside an effect was previously seen around the bookings page.
If touching that code, verify the current implementation before refactoring.
Booking persistence
At an earlier stage, My Bookings used localStorage.
This caused differences between browser/client state and SSR behavior.
Current code uses get_my_bookings and Supabase favorites tables. No localStorage/sessionStorage calls were found in application code.
Do not reintroduce localStorage as the primary source of truth for account-specific backend data.
Appointment old_price
A previous SQL insert/seed error occurred because:
appointments.old_price
had a NOT NULL constraint.
That constraint is a historical report. Current old_price nullability/defaults and other schema constraints: Requires live Supabase verification.
Always inspect actual schema constraints before creating test data or changing appointment creation logic.
17. UI / Product Decisions
The application is primarily Hebrew and RTL.
Customer experience has included:
- Home page
- Categories
- Appointment cards
- Appointment details
- Booking confirmation/terms
- My Bookings
- Favorites
- Saved businesses: /saved-businesses
- Business details and booking calendar: /b/[id] (currently requests at most six future published available appointments)
- Profile
Business experience has included:
- Dashboard
- Publish appointment
- Business profile
- Appointments
- Services: /business/services
- Business profile editing: description and instagram_url
Current customer profile location, notifications, settings, and help entries are largely static. Planned / not implemented yet: functional controls for these entries.
Use the existing visual language unless explicitly asked to redesign.
Do not redesign large sections while implementing a small functional task.
18. Development Workflow
The project uses a strict iterative workflow.
Always work like this:
ONE TASK → focused change → testing → QA → commit → next task
Rules:
- One focused change at a time.
- Do not bundle unrelated features.
- Explain what will change before editing.
- Modify only relevant files.
- After editing, summarize exactly what changed.
- Provide a QA checklist.
- Wait for QA before continuing.
- Do not commit or push unless explicitly asked.
This workflow is intentional and should be preserved.
19. Git Workflow
The project is used across more than one computer.
Preferred workflow:
At the beginning of a development session:
git pull
At the end of a completed, tested task:
git add .
git commit -m "clear message"
git push
Do not automatically execute commit/push unless explicitly requested.
Avoid destructive Git operations.
The current repository may be on a feature/refactor branch. Always inspect the active branch before making assumptions.
20. Deployment
Historical deployment/testing context below was not verified in this repository review:
Vercel is used for web deployment.
The app has also been tested using a mobile/iPhone simulator.
The testing target previously mentioned was an iPhone 12 Pro simulator.
Keep local development, GitHub, Supabase, and Vercel changes coordinated.
Do not modify deployment configuration unless the task requires it.
21. Cost Constraint
The user wants FreeSpot to remain as close to free/no-cost as practical during early development.
Before introducing:
- Paid APIs
- Paid infrastructure
- Paid SaaS dependencies
- Expensive geolocation/maps services
- Paid authentication services
explain the cost implications and consider a free alternative first.
22. Current Known State
Verified in repository as of this review:
- Login-first auth architecture is established.
- Customer and Business signup flows are separated.
- Customer phone is collected and sent in signup metadata.
- Customer and Business experiences are separated.
- Supabase is the main backend/auth/database.
- The UI reads service_templates and manages business_services.
- Service-driven appointment publishing is implemented.
- Publishing passes p_business_service_id to create_my_appointment_from_service; no direct appointment INSERT or legacy creation RPC call exists in application code.
- Appointment creation should go through approved RPC logic.
- Business verification checks exist in the UI; the manual helper remains unverified.
- Bookings, appointment favorites, and business favorites use Supabase; no localStorage/sessionStorage persistence is implemented.
- Search/location filters are only partly implemented; no Supabase Realtime subscriptions exist.
- Business/customer role separation and route protection are active areas of the app.
Historical end-to-end QA was reported previously and was not rerun in this review.
Requires live Supabase verification: actual schema, populated business_service_id, direct INSERT revocation, manual verification helper, auth configuration, RLS, RPC grants/definitions, ownership enforcement, booking concurrency, and phone privacy.
23. Current Priority / Next Hardening Task
The next focused task is to inspect the legacy free-text appointment RPC's live definition and effective permissions, then revoke authenticated access if it remains available.
Status: Requires live Supabase verification; do not assume the function is still accessible or that revocation is still outstanding.
Legacy function:
create_my_appointment(...)
Goal:
Authenticated users should no longer be able to use the legacy free-text appointment creation path.
Keep the newer service-driven function available:
create_my_appointment_from_service(...)
Before making this change:
1. Inspect the current function definitions.
2. Inspect function grants and effective access, including permissions inherited through PUBLIC and all overloads.
3. Search the entire repository for create_my_appointment.
4. Confirm no current UI flow still relies on the legacy function.
5. Propose the exact SQL permission change.
6. Do not execute unrelated SQL.
7. After the change, provide a QA/security checklist.
Future hardening should also include server-side/database validation where required.
Repository review found no UI call to create_my_appointment; the current publisher calls create_my_appointment_from_service.
If legacy access is already blocked, report that live result before selecting the next task.
24. Security Principles
For FreeSpot:
- Never trust client-side authorization alone.
- Use RLS for user-specific data.
- Use controlled RPC/database functions where business rules require it.
- Avoid direct table permissions when they bypass business logic.
- Keep customer data private.
- Do not expose phone numbers to unrelated businesses.
- Validate authenticated user/business identity server-side or in SQL.
- Validate business ownership before allowing business-side mutations.
- Validate appointment state before booking/cancelling.
- Prevent duplicate or unauthorized writes at the database level where possible.
25. How Codex Should Handle Uncertainty
If a requested task depends on information that is not visible in the repository, such as:
- Current Supabase grants
- Live RLS policies
- Database functions
- Production environment variables
- Vercel configuration
- Supabase dashboard settings
do NOT guess.
Instead:
1. State exactly what cannot be verified from the repository.
2. Ask for the relevant SQL/schema/output if necessary.
3. Provide a safe inspection query when appropriate.
4. Wait for confirmation before making irreversible changes.
26. Source of Truth Priority
When information conflicts, use this priority:
1. Live Supabase schema/security configuration
2. Current repository code
3. PROJECT_CONTEXT.md
4. Historical assumptions or old implementation notes
Report conflicts instead of silently choosing one.
27. Communication Style
The user may communicate with Codex in Hebrew.
Codex may explain steps in Hebrew.
Keep technical identifiers exactly as written in the project:
- File paths
- Function names
- Routes
- Table names
- Column names
- SQL/RPC names
When giving implementation instructions, be concrete and include exact file paths.
For SQL changes:
- Give the SQL query a clear descriptive name.
- Explain what it does in simple language.
- Change one database concern at a time.
- Provide QA after execution.
28. Important Reminder
FreeSpot is an evolving MVP.
Do not treat older code as automatically correct just because it exists.
Do not treat this context file as more authoritative than the live system.
The goal is to preserve working behavior, improve security and maintainability, and continue building the product incrementally without unnecessary rewrites.
