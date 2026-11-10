# NZT-25 | RESET

Painel pessoal para um protocolo de 25 dias. PWA instalável, funciona offline.

- `index.html` — app completo (dados do protocolo, camada de armazenamento, UI).
- `manifest.webmanifest`, `sw.js`, `icons/` — instalação e cache offline.

O progresso é salvo no `localStorage` do navegador/aparelho. A persistência passa por um
adaptador (`LocalAdapter`) com interface `load()/save()`, para que um adaptador de nuvem
possa ser adicionado no futuro sem mudar a interface.

Ao publicar uma nova versão, altere `VERSION` em `sw.js`.
