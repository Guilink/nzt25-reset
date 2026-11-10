# NZT-25 | RESET

Painel pessoal para um protocolo de 25 dias. PWA instalável, funciona offline.

- `index.html` — app (camada de armazenamento e UI).
- `protocol.js` — dados do protocolo e cálculo do bloco atual ("Agora"), compartilhado.
- `widget.html` — página compacta do bloco atual, para apps de widget da tela inicial.
- `manifest.webmanifest`, `sw.js`, `icons/` — instalação e cache offline.

O progresso é salvo no `localStorage` do navegador/aparelho. A persistência passa por um
adaptador (`LocalAdapter`) com interface `load()/save()`, para que um adaptador de nuvem
possa ser adicionado no futuro sem mudar a interface.

Ao publicar uma nova versão, altere `VERSION` em `sw.js`.
