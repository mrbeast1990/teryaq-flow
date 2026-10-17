# Flow Account Organization

Account disabling and phone edits do not require an administration code or login.
Anyone who can access Flow can make these organizational changes. Same-origin
JSON request checks protect against cross-site browser submissions; they are not authentication.

Disabling requires confirmation, fades the account card, and excludes it from
active directory totals. Details, accounting balances, and history remain available.
Reactivation applies immediately. Neither operation writes to AlmohasebSQL.

Phone overrides and disabled state are persisted in
`.data/account-administration/accounts.json`, including revisions and change history.
Identity combines source fingerprint, account kind, and person number. Stored
changes use the generic actor `Flow user`; no authenticated user identity is implied.

Empty phone overwrites, invalid identifiers, source changes, and stale revisions
are rejected server-side. Phone formatting is preserved; only WhatsApp links use
Libyan number normalization. CSV and print follow all current server filters.

Back up this gitignored directory securely. Run only one Flow writer process.
No administration credential or setup script is used. Stock Check authentication is unrelated.
