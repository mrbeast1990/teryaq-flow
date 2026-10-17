# Account Administration

Account closure and phone overrides belong only to Flow. They never update AlmohasebSQL.
The identity is the connection source fingerprint + customer/supplier kind + person number.

## Configure or Change the Administration Code

Run locally as the Windows user that runs Flow:

```powershell
cd E:\Test_Almohaseb_Old\teryaq-flow
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-account-admin.ps1
```

Enter and confirm a code of 8 to 128 characters in the hidden local prompts.
Do not send it in chat or put it in a command, source file, or environment variable.
This does not read or change the Stock Check PIN.

The script restricts `.data/account-administration` to the current Windows user
and stores only a salted scrypt verifier in `credential.json`. No server restart is
required. Changing the code invalidates existing management sessions on their next request.
Without a configured code, viewing works but management login and writes are disabled.

## Sessions and Storage

Management uses a host-scoped HttpOnly, SameSite=Strict cookie restricted to
`/_flow/accounts`, with Secure on public hosts. Sessions expire after 30 minutes,
or 10 minutes idle, and are revoked by logout or Flow restart. Writes require
the server session, matching Origin, JSON, and an up-to-date record revision.
Login failures are limited to five per IP in 15 minutes with a global attempt cap.

`accounts.json` stores raw phone overrides, original phones, closure state, revisions,
and metadata change history. It does not store balances or SQL credentials.
Back up this directory securely and preserve its Windows permissions. Never commit
it or the credential verifier. The existing `.data/` ignore rule excludes it.
Only one Flow production process should write this file store at a time.

List state filters default to active accounts. Active and closed subtotals respect
the same search, balance, and no-payment filters. The selected list count and total,
CSV and print follow the selected state as well. Accounting reports are unchanged.
Ordering is server-side with missing payment dates last and person number as the
final tie-breaker. Balance ordering uses the signed accounting balance, not its absolute value.
