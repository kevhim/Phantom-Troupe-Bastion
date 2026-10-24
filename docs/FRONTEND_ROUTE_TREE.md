# Frontend component checklist v2
See `FRONTEND_SPEC.md` for all 72 planned UI blocks and semantics.
```
apps/web/src/
  app/ AppShell / route definitions / RBAC / environment mode
  pages/ overview / agent / wallet / approvals / security / hardware / evidence / settings
  components/
    shell/         AppSidebar GlobalTopbar EnvironmentModeStrip GlobalIncidentBanner ApprovalDrawer AuditFooter
    payments/      intent summary, UserOp status, receipt, activity
    policy/        allowed contracts/selectors/recipients/limits/sessions/role tiers
    approvals/     device review, OLED replica, signatures, owner cosign, approval history
    security/      attack scenario lab, threat matrix, emergency timeline, health
    hardware/      topology, pins, device firmware and source provenance
    evidence/      audit chain, receipt verifier, incident export
    shared/        accessible primitives, full-address field, time/status/amount display
```
No frontend component is permitted to keep owner/ESP32 private key or declare payment successful without verified chain receipt. All financial exception approvals happen outside the ordinary operator UI, with direct ESP32 physical input.
