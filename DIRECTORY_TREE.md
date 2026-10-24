# Actual repository tree (directories + key docs)

```text
BASTION_X_v2_Architecture_Repository/
  PROJECT_MASTER.md / AGENTS.md / CLAUDE.md / README.md / rules.md
  apps/web/src/{app,pages[8],components[8],features[6],api,hooks,stores,types,styles}/
  services/{api,agent,vision,gateway,edge-q,indexer,supervisor,device-crypto}/
  contracts/{src,test,script}/
  firmware/{esp32_signer,esp32_observer,esp32_display,uno_operator,uno_supervisor,uno_q_mcu,esp8266_alert}/
  schemas/{api,events,contracts,signing,revocation}/
  infra/{local-chain,network,scripts,signing-device,fallback-chain}/
  tests/{adversarial,e2e,fixtures,firmware,contracts,integration,network-failure}/
  docs/{HARDWARE_MAP,TRUSTED_SIGNER_DESIGN,CONTRACT_DESIGN,FRONTEND_SPEC,...}.md
  scripts/{run,setup}/
  .github/workflows/
```

Every directory contains a `rules.md`. Run `find . -type d` to enumerate the complete tree.
