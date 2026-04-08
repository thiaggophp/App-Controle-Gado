# GadoControle — App de Gestão de Gado de Corte

## Stack
- React + Vite 5 (PWA)
- PocketBase como backend (mesmo servidor do financas-casa)
- EmailJS para envio de senhas
- Frontend hospedado no VPS (nginx)
- URL: https://gado.financascasa.online

## Infraestrutura
- **VPS:** Locaweb — Debian 12 — IP em secrets do GitHub (VPS_HOST)
- **API compartilhada:** https://api.financascasa.online (PocketBase :8090)
- **App:** /var/www/gado-html/ (servido pelo nginx)
- **Código:** /var/www/gado-controle/

## Coleções no PocketBase (prefixo gado_)
- **gado_accounts**: email, name, password, role, status, parentEmail, mustChangePassword (bool), protected (bool)
- **gado_signup_requests**: email, name, requestedAt, status
- **gado_fazendas**: ownerEmail, nome, cidade
- **gado_lotes**: ownerEmail, fazendaId, nome, dataEntrada, racaPredominante, status, qtdEntrada (number), pesoMedioEntrada (number), valorCabeca (number), obs
- **gado_animais**: ownerEmail, loteId, brinco, sexo, raca, pesoEntrada (number), dataEntrada, status, causaBaixa, obs
- **gado_pesagens**: ownerEmail, loteId, animalId, data, peso (number), tipo (individual/lote), obs
- **gado_custos**: ownerEmail, loteId, data, tipo, valor (number), descricao
- **gado_vendas**: ownerEmail, loteId, data, qtdAnimais (number), arrobas (number), valorArroba (number), total (number), comprador, obs
- **gado_saude**: ownerEmail, loteId, animalId, data, tipo, produto, dose, proxDose, obs

## Variáveis de ambiente (.env)
```
VITE_PB_URL=https://api.financascasa.online
VITE_ADMIN_EMAIL=<email_admin>
VITE_ADMIN_PASSWORD=<senha_admin>
VITE_EMAILJS_SERVICE_ID=<id>
VITE_EMAILJS_TEMPLATE_ID=<id>
VITE_EMAILJS_PUBLIC_KEY=<chave>
```

## Comandos
- `npm run dev` — rodar local
- `npm run build` — gerar build
- `git add . && git commit -m "msg" && git push` — deploy automático

## Problemas conhecidos (herdados do financas-casa)
- Usar Vite 5 (não 8) — Vite 8 falha com pocketbase no Linux
- Fazer build no VPS, não no GitHub Actions
- PocketBase API Rules: deixar todos os campos vazios em cada coleção
- Não gerar IDs manuais — deixar o PocketBase criar
- Service worker: incrementar versão do CACHE em sw.js a cada deploy importante
