(function () {
  "use strict";

  const ROUTES = ["home", "about", "work", "method", "skills", "impact", "contact"];
  const LANGS = ["pt", "en"];
  const HTML_LANG = { pt: "pt-BR", en: "en" };
  const STORAGE_KEY = "af-lang";
  const content = window.CONTENT;
  const profile = window.PROFILE;

  const state = {
    lang: initialLang(),
    route: "home",
    caseId: null,
    journey: 3,
    stage: 0,
    level: "all",
    dimension: "all",
    heroPlayed: false
  };

  let destroyHero = null;
  let firstRoute = true;

  function h(tag, props, children) {
    const el = document.createElement(tag);
    if (props) {
      for (const key in props) {
        const value = props[key];
        if (value === null || value === undefined || value === false) continue;
        if (key === "class") el.className = value;
        else if (key === "text") el.textContent = value;
        else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
        else el.setAttribute(key, value === true ? "" : value);
      }
    }
    append(el, children);
    return el;
  }

  function append(el, children) {
    if (children === null || children === undefined || children === false) return;
    if (Array.isArray(children)) {
      for (const child of children) append(el, child);
      return;
    }
    el.append(children instanceof Node ? children : document.createTextNode(String(children)));
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function readStorage() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeStorage(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function initialLang() {
    const param = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(param)) return param;
    const stored = readStorage();
    if (LANGS.includes(stored)) return stored;
    return (navigator.language || "pt").toLowerCase().startsWith("pt") ? "pt" : "en";
  }

  function safeUrl(value) {
    if (typeof value !== "string" || !value) return null;
    try {
      const url = new URL(value, location.href);
      return url.protocol === "https:" || url.origin === location.origin ? url.href : null;
    } catch (e) {
      return null;
    }
  }

  function safeEmail(value) {
    return typeof value === "string" && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(value) ? value : null;
  }

  function t() {
    return content[state.lang];
  }

  function routeLink(route, label, cls) {
    return h("a", { href: "#" + route, class: cls }, label);
  }

  function header(title, intro, extra) {
    return h("header", { class: "page-head" }, [
      h("h1", { class: "page-head__title", tabindex: "-1" }, title),
      intro ? h("p", { class: "page-head__intro" }, intro) : null,
      extra || null
    ]);
  }

  function levelMark(level) {
    return h("span", { class: "mark mark--" + level, "aria-hidden": "true" });
  }

  function renderNav() {
    const c = t();
    const list = document.getElementById("nav-list");
    list.replaceChildren(
      ...ROUTES.map(function (route, i) {
        return h("li", null, h("a", { href: "#" + route, class: "nav__link", "data-route": route }, [
          h("span", { class: "nav__index", "aria-hidden": "true" }, pad(i + 1)),
          c.ui.nav[route]
        ]));
      })
    );
    document.getElementById("nav").setAttribute("aria-label", state.lang === "pt" ? "Principal" : "Main");
    const lang = document.getElementById("lang-toggle");
    lang.textContent = c.ui.langShort;
    lang.setAttribute("aria-label", c.ui.langSwitch);
    lang.setAttribute("title", c.ui.langSwitch);
    document.getElementById("burger").setAttribute("aria-label", c.ui.menu);
    document.querySelector(".skip").textContent = c.ui.skip;
    document.getElementById("footer-text").textContent = c.footer;
    document.getElementById("footer-home").textContent = c.ui.backHome;
    document.documentElement.lang = HTML_LANG[state.lang];
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", c.meta.description);
  }

  function renderHome() {
    const c = t().home;
    const canvas = h("canvas", { class: "hero__canvas", "aria-hidden": "true" });
    const view = document.getElementById("view-home");
    view.replaceChildren(
      h("div", { class: "hero" }, [
        h("div", { class: "hero__text" }, [
          h("p", { class: "eyebrow" }, c.kicker),
          h("h1", { class: "hero__name", tabindex: "-1" }, profile.name),
          h("p", { class: "hero__role" }, c.role),
          h("p", { class: "hero__headline" }, [c.headline[0] + " ", h("em", null, c.headline[1])]),
          h("p", { class: "hero__lead" }, c.lead),
          h("div", { class: "hero__cta" }, [
            routeLink(c.shortcuts[1].to, c.shortcuts[1].label, "btn btn--primary"),
            routeLink(c.shortcuts[3].to, c.shortcuts[3].label, "btn btn--ghost")
          ])
        ]),
        h("figure", { class: "hero__visual" }, [canvas, h("figcaption", null, c.visualCaption)])
      ]),
      h("div", { class: "home-grid" }, [
        h("section", { class: "zone pillars", "aria-labelledby": "pillars-title" }, [
          h("h2", { class: "zone__title", id: "pillars-title" }, c.pillarsTitle),
          h("ol", { class: "pillars__list" }, c.pillars.map(function (p, i) {
            return h("li", { class: "pillars__item" }, [
              h("span", { class: "pillars__num" }, pad(i + 1)),
              h("h3", null, p.title),
              h("p", null, p.text)
            ]);
          }))
        ]),
        h("nav", { class: "zone shortcuts", "aria-labelledby": "shortcuts-title" }, [
          h("h2", { class: "zone__title", id: "shortcuts-title" }, c.shortcutsTitle),
          h("ul", { class: "shortcuts__list" }, c.shortcuts.map(function (s) {
            return h("li", null, h("a", { href: "#" + s.to, class: "shortcuts__link" }, [
              h("span", null, s.label),
              h("span", { class: "arrow", "aria-hidden": "true" }, "→")
            ]));
          }))
        ])
      ])
    );
    if (destroyHero) destroyHero();
    destroyHero = window.Hero ? window.Hero.mount(canvas, { instant: state.heroPlayed }) : null;
    state.heroPlayed = true;
  }

  function renderAbout() {
    const c = t().about;
    const view = document.getElementById("view-about");
    const panel = h("div", { class: "journey__panel", id: "journey-panel", role: "tabpanel" });
    const tabs = c.journey.map(function (step, i) {
      return h("button", {
        type: "button",
        role: "tab",
        id: "journey-tab-" + i,
        class: "journey__step" + (step.learning ? " journey__step--learning" : ""),
        "aria-controls": "journey-panel",
        onclick: function () { selectJourney(i); },
        onkeydown: function (e) { tabKeys(e, i, c.journey.length, selectJourney); }
      }, [
        h("span", { class: "journey__dot", "aria-hidden": "true" }),
        h("span", { class: "journey__num" }, pad(i + 1)),
        h("span", { class: "journey__area" }, step.area)
      ]);
    });

    function selectJourney(i) {
      state.journey = i;
      const step = c.journey[i];
      tabs.forEach(function (tab, j) {
        tab.setAttribute("aria-selected", String(i === j));
        tab.tabIndex = i === j ? 0 : -1;
        tab.classList.toggle("is-passed", j < i);
      });
      panel.setAttribute("aria-labelledby", "journey-tab-" + i);
      panel.replaceChildren(
        h("p", { class: "journey__adds" }, [
          h("span", { class: "tag" + (step.learning ? " tag--learning" : "") }, step.adds)
        ]),
        h("h3", null, step.area),
        h("p", null, step.text)
      );
      panel.classList.remove("fade-in");
      void panel.offsetWidth;
      panel.classList.add("fade-in");
      track.style.setProperty("--progress", (i / (c.journey.length - 1)).toFixed(3));
    }

    const track = h("div", { class: "journey__tabs", role: "tablist", "aria-label": c.journeyTitle }, tabs);

    view.replaceChildren(
      header(c.title, c.intro),
      h("section", { class: "zone journey", "aria-labelledby": "journey-title" }, [
        h("div", { class: "zone__head" }, [
          h("h2", { class: "zone__title", id: "journey-title" }, c.journeyTitle),
          h("span", { class: "zone__hint" }, c.journeyHint)
        ]),
        track,
        panel
      ]),
      h("div", { class: "split" }, [
        h("section", { class: "zone", "aria-labelledby": "traits-title" }, [
          h("h2", { class: "zone__title", id: "traits-title" }, c.profileTitle),
          h("ul", { class: "traits" }, c.traits.map(function (trait) { return h("li", null, trait); }))
        ]),
        h("section", { class: "zone", "aria-labelledby": "principles-title" }, [
          h("h2", { class: "zone__title", id: "principles-title" }, c.philosophyTitle),
          h("ol", { class: "principles" }, c.principles.map(function (p, i) {
            return h("li", null, [h("span", { class: "principles__num" }, pad(i + 1)), p]);
          })),
          h("blockquote", { class: "quote" }, h("p", null, c.quote))
        ])
      ]),
      h("section", { class: "zone direction", "aria-labelledby": "direction-title" }, [
        h("h2", { class: "zone__title", id: "direction-title" }, c.directionTitle),
        h("p", null, c.directionText),
        h("ul", { class: "chips" }, c.direction.map(function (d) { return h("li", { class: "chip chip--learning" }, d); })),
        h("p", { class: "note" }, c.directionNote)
      ]),
      h("section", { class: "zone", "aria-labelledby": "education-title" }, [
        h("h2", { class: "zone__title", id: "education-title" }, c.educationTitle),
        h("ul", { class: "education" }, c.education.map(function (e) {
          return h("li", null, [h("strong", null, e.title), h("span", null, e.detail)]);
        }))
      ])
    );
    selectJourney(state.journey);
  }

  function tabKeys(e, i, total, select) {
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % total;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + total) % total;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = total - 1;
    if (next === null) return;
    e.preventDefault();
    select(next);
    const list = e.currentTarget.parentElement;
    list.children[next].focus();
  }

  function renderWork() {
    const c = t().work;
    const view = document.getElementById("view-work");
    view.replaceChildren(
      header(c.title, c.intro, h("p", { class: "notice" }, c.privacy)),
      h("ol", { class: "cases" }, c.cases.map(function (item, i) {
        return h("li", null, h("a", { href: "#work/" + item.id, class: "case-card" }, [
          h("span", { class: "case-card__num" }, pad(i + 1)),
          h("h2", { class: "case-card__title" }, item.title),
          h("p", { class: "case-card__summary" }, item.summary),
          h("ul", { class: "case-card__skills" }, item.skills.slice(0, 3).map(function (s) {
            return h("li", null, s);
          })),
          h("span", { class: "case-card__more" }, [t().ui.openCase, h("span", { class: "arrow", "aria-hidden": "true" }, " →")])
        ]));
      }))
    );
  }

  function caseBlock(label, body, tag, tagClass) {
    return h("section", { class: "case__block" }, [
      h("h3", { class: "case__label" }, [label, tag ? h("span", { class: "tag " + tagClass }, tag) : null]),
      body
    ]);
  }

  function list(items, cls) {
    return h("ul", { class: cls || "list" }, items.map(function (item) { return h("li", null, item); }));
  }

  function openCase(id) {
    const c = t().work;
    const index = c.cases.findIndex(function (item) { return item.id === id; });
    const dialog = document.getElementById("case-dialog");
    if (index < 0) {
      if (dialog.open) dialog.close();
      return;
    }
    const item = c.cases[index];
    const ui = t().ui;
    const total = c.cases.length;
    const prev = c.cases[(index - 1 + total) % total];
    const next = c.cases[(index + 1) % total];
    const L = c.labels;

    dialog.replaceChildren(
      h("div", { class: "case__inner" }, [
        h("header", { class: "case__head" }, [
          h("p", { class: "case__counter" }, ui.caseCounter.replace("{n}", pad(index + 1)).replace("{total}", pad(total))),
          h("h2", { class: "case__title", id: "case-title" }, item.title),
          h("button", { type: "button", class: "icon-btn case__close", "aria-label": ui.close, onclick: closeCase }, "×")
        ]),
        h("div", { class: "case__body" }, [
          h("div", { class: "case__pair" }, [
            caseBlock("01 · " + L.context, h("p", null, item.context)),
            caseBlock("02 · " + L.challenge, h("p", null, item.challenge))
          ]),
          caseBlock("03 · " + L.role, list(item.role, "list list--check"), c.roleTag, "tag--individual"),
          caseBlock("04 · " + L.strategy, list(item.strategy, "list list--steps")),
          caseBlock("05 · " + L.solution, h("div", null, [
            h("ul", { class: "chips" }, item.solution.map(function (s) { return h("li", { class: "chip" }, s); })),
            h("p", { class: "note" }, c.teamNote)
          ]), c.teamTag, "tag--team"),
          caseBlock("06 · " + L.results, h("div", null, [
            list(item.results),
            h("p", { class: "note" }, c.resultsNote)
          ]), c.teamTag, "tag--team"),
          caseBlock("07 · " + L.learnings, list(item.learnings, "list list--quote")),
          caseBlock("08 · " + L.skills, h("ul", { class: "chips" }, item.skills.map(function (s) {
            return h("li", { class: "chip chip--accent" }, s);
          })))
        ]),
        h("footer", { class: "case__foot" }, [
          h("a", { href: "#work/" + prev.id, class: "case__nav" }, [h("span", { class: "case__nav-label" }, "← " + ui.prev), h("span", null, prev.title)]),
          h("a", { href: "#work/" + next.id, class: "case__nav case__nav--next" }, [h("span", { class: "case__nav-label" }, ui.next + " →"), h("span", null, next.title)])
        ])
      ])
    );
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(".case__inner").scrollTop = 0;
    dialog.querySelector(".case__close").focus();
  }

  function closeCase() {
    const dialog = document.getElementById("case-dialog");
    if (!dialog.open) return;
    dialog.dataset.last = state.caseId || "";
    dialog.close();
  }

  function renderMethod() {
    const c = t().method;
    const view = document.getElementById("view-method");
    const panel = h("div", { class: "stage__panel", id: "stage-panel", role: "tabpanel" });
    const tabs = c.stages.map(function (stage, i) {
      return h("button", {
        type: "button",
        role: "tab",
        id: "stage-tab-" + i,
        class: "stage__tab",
        "aria-controls": "stage-panel",
        onclick: function () { selectStage(i); },
        onkeydown: function (e) { tabKeys(e, i, c.stages.length, selectStage); }
      }, [h("span", { class: "stage__num" }, pad(i + 1)), h("span", null, stage.title)]);
    });

    function practiceList(items) {
      return h("ul", { class: "practices" }, items.map(function (p) {
        return h("li", { class: "practice practice--" + p[1] }, [
          h("span", { class: "practice__mark", "aria-hidden": "true" }),
          h("span", null, p[0]),
          h("span", { class: "sr-only" }, " (" + c.legend[p[1]] + ")")
        ]);
      }));
    }

    function selectStage(i) {
      state.stage = i;
      const stage = c.stages[i];
      tabs.forEach(function (tab, j) {
        tab.setAttribute("aria-selected", String(i === j));
        tab.tabIndex = i === j ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", "stage-tab-" + i);
      panel.replaceChildren(
        h("div", { class: "stage__intro" }, [
          h("span", { class: "stage__big", "aria-hidden": "true" }, pad(i + 1)),
          h("div", null, [h("h2", null, stage.title), h("p", null, stage.summary)])
        ]),
        h("div", { class: "stage__cols" }, [
          h("div", null, [h("h3", { class: "stage__sub" }, c.practicesTitle), practiceList(stage.practices)]),
          stage.refs.length ? h("div", null, [h("h3", { class: "stage__sub" }, c.refsTitle), practiceList(stage.refs)]) : null
        ])
      );
      panel.classList.remove("fade-in");
      void panel.offsetWidth;
      panel.classList.add("fade-in");
    }

    view.replaceChildren(
      header(c.title, c.intro, h("ul", { class: "legend" }, [
        h("li", null, [h("span", { class: "practice__mark practice__mark--done", "aria-hidden": "true" }), c.legend.done]),
        h("li", null, [h("span", { class: "practice__mark practice__mark--known", "aria-hidden": "true" }), c.legend.known])
      ])),
      h("div", { class: "zone stage" }, [
        h("div", { class: "stage__tabs", role: "tablist", "aria-label": c.title }, tabs),
        panel
      ])
    );
    selectStage(state.stage);
  }

  function filterBar(label, options, current, onSelect) {
    return h("div", { class: "filters", role: "group", "aria-label": label }, options.map(function (o) {
      return h("button", {
        type: "button",
        class: "filter" + (o.cls ? " " + o.cls : ""),
        "aria-pressed": String(current === o.id),
        onclick: function () { onSelect(o.id); }
      }, [o.mark || null, o.label, o.count !== undefined ? h("span", { class: "filter__count" }, o.count) : null]);
    }));
  }

  function renderSkills() {
    const c = t().skills;
    const view = document.getElementById("view-skills");
    const levels = ["practice", "knowledge", "learning"];
    const all = c.categories.flatMap(function (cat) { return cat.items; }).concat(c.tools);
    const counts = { all: all.length };
    for (const item of all) counts[item[1]] = (counts[item[1]] || 0) + 1;

    function match(item) {
      return state.level === "all" || item[1] === state.level;
    }

    function itemList(items) {
      return h("ul", { class: "skill-list" }, items.map(function (item) {
        return h("li", { class: "skill" + (match(item) ? "" : " is-dim") }, [
          levelMark(item[1]),
          h("span", null, item[0]),
          h("span", { class: "sr-only" }, " (" + c.levels[item[1]].label + ")")
        ]);
      }));
    }

    view.replaceChildren(
      header(c.title, c.intro),
      h("section", { class: "zone levels" }, h("dl", { class: "levels__list" }, levels.map(function (l) {
        return h("div", { class: "levels__item" }, [
          h("dt", null, [levelMark(l), c.levels[l].label]),
          h("dd", null, c.levels[l].text)
        ]);
      }))),
      filterBar(c.filterLabel, [{ id: "all", label: c.filterAll, count: counts.all }].concat(levels.map(function (l) {
        return { id: l, label: c.levels[l].label, count: counts[l] || 0, mark: levelMark(l) };
      })), state.level, function (id) {
        state.level = id;
        renderSkills();
        const pressed = view.querySelector('.filter[aria-pressed="true"]');
        if (pressed) pressed.focus();
      }),
      h("div", { class: "skill-grid" }, c.categories.map(function (cat) {
        return h("section", { class: "zone skill-group" }, [
          h("h2", { class: "zone__title" }, cat.title),
          itemList(cat.items)
        ]);
      }).concat(h("section", { class: "zone skill-group skill-group--tools" }, [
        h("h2", { class: "zone__title" }, c.toolsTitle),
        itemList(c.tools),
        h("p", { class: "note" }, c.toolsNote)
      ])))
    );
  }

  function renderImpact() {
    const c = t().impact;
    const cases = t().work.cases;
    const view = document.getElementById("view-impact");
    const dimTitle = {};
    const counts = { all: 0 };
    for (const d of c.dimensions) dimTitle[d.id] = d.title;
    for (const item of cases) {
      for (const dims of c.dims[item.id]) {
        counts.all++;
        for (const d of dims) counts[d] = (counts[d] || 0) + 1;
      }
    }
    const active = c.dimensions.find(function (d) { return d.id === state.dimension; });

    view.replaceChildren();
    append(view, [
      header(c.title, c.intro, h("ul", { class: "questions" }, c.questions.map(function (q) { return h("li", null, q); }))),
      filterBar(c.filterLabel, [{ id: "all", label: c.filterAll, count: counts.all }].concat(c.dimensions.map(function (d) {
        return { id: d.id, label: d.title, count: counts[d.id] || 0, cls: "filter--dim dim-" + d.id };
      })), state.dimension, function (id) {
        state.dimension = id;
        renderImpact();
        const pressed = view.querySelector('.filter[aria-pressed="true"]');
        if (pressed) pressed.focus();
      }),
      active ? h("div", { class: "dim-detail fade-in dim-" + active.id }, [
        h("strong", null, active.title),
        h("ul", null, active.items.map(function (i) { return h("li", null, i); }))
      ]) : null,
      h("div", { class: "impact-grid" }, cases.map(function (item, ci) {
        return h("section", { class: "zone impact-card" }, [
          h("header", { class: "impact-card__head" }, [
            h("span", { class: "impact-card__num" }, pad(ci + 1)),
            h("h2", null, item.title)
          ]),
          h("ul", { class: "impact-list" }, item.results.map(function (r, ri) {
            const dims = c.dims[item.id][ri] || [];
            const on = state.dimension === "all" || dims.includes(state.dimension);
            return h("li", { class: on ? "" : "is-dim" }, [
              h("span", null, r),
              h("span", { class: "dims" }, dims.map(function (d) {
                return h("span", { class: "dim dim-" + d, title: dimTitle[d] }, dimTitle[d]);
              }))
            ]);
          })),
          h("a", { href: "#work/" + item.id, class: "link" }, [c.seeCase, h("span", { class: "arrow", "aria-hidden": "true" }, " →")])
        ]);
      })),
      h("p", { class: "notice" }, c.disclosure)
    ]);
  }

  function renderContact() {
    const c = t().contact;
    const ui = t().ui;
    const view = document.getElementById("view-contact");
    const email = safeEmail(profile.email);
    const linkedin = safeUrl(profile.linkedin);
    const resume = safeUrl(profile.resume && profile.resume[state.lang]);

    function row(label, value, href, external, extra) {
      return h("li", { class: "channel" + (href ? "" : " is-empty") }, [
        h("span", { class: "channel__label" }, label),
        href
          ? h("a", { href: href, class: "channel__value", target: external ? "_blank" : null, rel: external ? "noopener noreferrer" : null }, value)
          : h("span", { class: "channel__value" }, ui.soon),
        extra || null
      ]);
    }

    view.replaceChildren(
      h("div", { class: "contact" }, [
        h("div", { class: "contact__text" }, [
          h("p", { class: "eyebrow" }, c.title),
          h("h1", { class: "contact__title", tabindex: "-1" }, c.text),
          h("p", { class: "contact__availability" }, c.availability)
        ]),
        h("ul", { class: "zone channels" }, [
          row(c.email, email, email ? "mailto:" + email : null, false, email ? h("button", {
            type: "button",
            class: "btn btn--small btn--ghost",
            onclick: function () { copyEmail(email); }
          }, ui.copy) : null),
          row(c.linkedin, linkedin ? linkedin.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "") : null, linkedin, true),
          row(c.resume, c.resumeValue, resume, true)
        ])
      ])
    );
  }

  function copyEmail(email) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(email).then(function () { toast(t().ui.copied); }, function () {});
  }

  let toastTimer = 0;
  function toast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 2200);
  }

  function renderAll() {
    renderNav();
    renderHome();
    renderAbout();
    renderWork();
    renderMethod();
    renderSkills();
    renderImpact();
    renderContact();
  }

  function parseHash() {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const route = ROUTES.includes(parts[0]) ? parts[0] : "home";
    const caseId = route === "work" && parts[1] ? parts[1] : null;
    return { route: route, caseId: caseId };
  }

  function applyRoute() {
    const parsed = parseHash();
    const changed = parsed.route !== state.route || firstRoute;
    state.route = parsed.route;
    state.caseId = parsed.caseId;

    if (changed) {
      for (const view of document.querySelectorAll(".view")) {
        const on = view.dataset.view === state.route;
        view.hidden = !on;
        view.classList.toggle("view--enter", on);
      }
      for (const link of document.querySelectorAll(".nav__link")) {
        if (link.dataset.route === state.route) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
      window.scrollTo(0, 0);
      if (!firstRoute) {
        const heading = document.querySelector('[data-view="' + state.route + '"] [tabindex="-1"]');
        if (heading) heading.focus({ preventScroll: true });
      }
    }
    updateTitle();
    setMenu(false);

    if (state.caseId) openCase(state.caseId);
    else closeCase();
    firstRoute = false;
  }

  function updateTitle() {
    const c = t();
    let title = state.route === "home" ? c.meta.title : c.ui.nav[state.route] + " — " + profile.name;
    if (state.caseId) {
      const item = c.work.cases.find(function (i) { return i.id === state.caseId; });
      if (item) title = item.title + " — " + profile.name;
    }
    document.title = title;
  }

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    const burger = document.getElementById("burger");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? t().ui.closeMenu : t().ui.menu);
  }

  function setLang(lang) {
    state.lang = lang;
    writeStorage(lang);
    const url = new URL(location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url);
    }
    renderAll();
    for (const link of document.querySelectorAll(".nav__link")) {
      if (link.dataset.route === state.route) link.setAttribute("aria-current", "page");
    }
    updateTitle();
    if (state.caseId) openCase(state.caseId);
  }

  function init() {
    const dialog = document.getElementById("case-dialog");
    dialog.addEventListener("close", function () {
      if (parseHash().caseId) history.replaceState(null, "", "#work");
      state.caseId = null;
      updateTitle();
      const card = document.querySelector('.case-card[href="#work/' + (dialog.dataset.last || "") + '"]');
      if (card && state.route === "work") card.focus({ preventScroll: true });
    });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) closeCase();
    });
    dialog.addEventListener("cancel", function () {
      dialog.dataset.last = state.caseId || "";
    });

    document.getElementById("lang-toggle").addEventListener("click", function () {
      setLang(state.lang === "pt" ? "en" : "pt");
    });
    document.getElementById("burger").addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
    });
    window.addEventListener("hashchange", applyRoute);

    renderAll();
    applyRoute();
  }

  init();
})();
