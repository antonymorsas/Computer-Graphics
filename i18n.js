// English / Spanish for the demo pages. Pages are written in English; Spanish
// comes from attributes and is used when the URL has ?lang=es.
//
// In the HTML (load this script in <head>, before the page's own scripts):
//   data-es="..."        Spanish textContent (also works on <title>).
//   data-es-html="..."   Spanish innerHTML, for text with <strong>, <code>, etc.
//   data-es-label="..."  Spanish aria-label.
//   data-es-href="..."   Spanish href (e.g. antonymorsas.com/es/cosas).
//   <div data-lang-switch></div>  gets an EN / ES switch (styled by .lang-switch).
// In JS, for text set at runtime (buttons, canvas):
//   t("Pause", "Pausa")  returns the string for the current language.
//   LANG                 "en" or "es".
(function () {
    var LANG = new URLSearchParams(window.location.search).get("lang") === "es" ? "es" : "en";
    window.LANG = LANG;
    window.t = function (en, es) {
        return LANG === "es" ? es : en;
    };
    document.documentElement.lang = LANG;

    function urlFor(lang) {
        var url = new URL(window.location.href);
        if (lang === "es") url.searchParams.set("lang", "es");
        else url.searchParams.delete("lang");
        return url.pathname + url.search + url.hash;
    }

    function apply() {
        if (LANG === "es") {
            document.querySelectorAll("[data-es]").forEach(function (el) {
                el.textContent = el.getAttribute("data-es");
            });
            document.querySelectorAll("[data-es-html]").forEach(function (el) {
                el.innerHTML = el.getAttribute("data-es-html");
            });
            document.querySelectorAll("[data-es-label]").forEach(function (el) {
                el.setAttribute("aria-label", el.getAttribute("data-es-label"));
            });
            document.querySelectorAll("[data-es-href]").forEach(function (el) {
                el.setAttribute("href", el.getAttribute("data-es-href"));
            });
        }
        document.querySelectorAll("[data-lang-switch]").forEach(function (el) {
            el.className = "lang-switch";
            el.setAttribute("aria-label", LANG === "es" ? "Idioma" : "Language");
            el.innerHTML =
                '<a href="' + urlFor("en") + '" hreflang="en" lang="en"' + (LANG === "en" ? ' aria-current="true"' : "") + ">EN</a>" +
                '<span aria-hidden="true">/</span>' +
                '<a href="' + urlFor("es") + '" hreflang="es" lang="es"' + (LANG === "es" ? ' aria-current="true"' : "") + ">ES</a>";
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
    else apply();
})();
