# Ana Fipke — Portfólio

Site estático (HTML, CSS e JavaScript, sem build) publicado com GitHub Pages.

## Publicar

1. Crie o repositório `AnaCFipke.github.io` e envie o conteúdo desta pasta.
2. Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. O site fica em `https://anacfipke.github.io/`.

## Editar

- Textos (PT e EN): `assets/js/content.js`
- Contato (e-mail, LinkedIn, currículo): objeto `PROFILE` no topo de `assets/js/content.js`. Links vazios aparecem como "Em breve"; o LinkedIn e o currículo precisam começar com `https://`.
- Níveis de conhecimento: `"practice"`, `"knowledge"` ou `"learning"` em `skills`; práticas executadas ou conhecidas: `"done"` ou `"known"` em `method`.

## Rotas

`#home`, `#about`, `#work`, `#work/legacy`, `#work/scheduling`, `#work/services`, `#work/digitization`, `#method`, `#skills`, `#impact`, `#contact`. Use `?lang=en` para abrir em inglês.

## Rodar localmente

```sh
python3 -m http.server 8000
```
