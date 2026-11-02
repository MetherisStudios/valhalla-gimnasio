/* =========================================================
   Valhalla Gimnasio · main.js
   ---------------------------------------------------------
   DATOS DEL COMERCIO: se cambian solo acá.
   ========================================================= */
const CONFIG = {
  // WhatsApp con código de país (598) y sin el 0 inicial ni espacios.
  whatsapp: "59894668629",
  // Cómo se muestra el teléfono en la web.
  telefonoVisible: "094 668 629",
  telefonoLlamar: "+59894668629",

  // Clave de Web3Forms de este cliente (web3forms.com). Sin clave, el formulario no envía.
  web3formsKey: "",
  asuntoMail: "Nueva consulta desde la web de Valhalla Gimnasio",

  // Link "Calificanos en Google" (Perfil de Empresa > Pedir reseñas). Vacío = el botón no se muestra.
  googleReviewUrl: "",

  // Google Maps
  mapsPlace: "https://www.google.com/maps/search/?api=1&query=Valhalla%20Gimnasio%2C%20Pinamar%2C%20Canelones",
  mapsDirections: "https://www.google.com/maps/dir/?api=1&destination=64CR%2BM5%20Pinamar%2C%20Canelones",

  // Horarios (hora de inicio y fin en horas, 24 h). "con" = con instructor, "sin" = sin instructor.
  zonaHoraria: "America/Montevideo",
  horarios: {
    1: [["con", 6, 10], ["sin", 10, 14], ["con", 14, 22]], // lunes
    2: [["con", 6, 10], ["sin", 10, 14], ["con", 14, 22]], // martes
    3: [["con", 6, 10], ["sin", 10, 14], ["con", 14, 22]], // miércoles
    4: [["con", 6, 10], ["sin", 10, 14], ["con", 14, 22]], // jueves
    5: [["con", 6, 10], ["sin", 10, 14], ["con", 14, 22]], // viernes
    6: [["sin", 6, 22]],                                    // sábado
    0: [["sin", 6, 22]]                                     // domingo
  }
};

const DIAS = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado", 0: "Domingo" };
const DIAS_CORTOS = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 0: "Dom" };
const ABRE = 6, CIERRA = 22;

/* ---------- Pantalla de entrada (2 s) ---------- */
(function intro() {
  const el = document.getElementById("intro");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finish = () => {
    el.classList.add("is-done");
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
  };
  setTimeout(finish, reduce ? 300 : 2000);
})();

/* ---------- Links de WhatsApp, teléfono y mapas ---------- */
function waLink(msg) {
  return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
}
document.querySelectorAll("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa); });
document.querySelectorAll("[data-tel]").forEach(a => {
  a.href = "tel:" + CONFIG.telefonoLlamar;
  if (!a.children.length) a.textContent = CONFIG.telefonoVisible;
});
document.querySelectorAll("[data-phone-text]").forEach(s => { s.textContent = CONFIG.telefonoVisible; });
document.querySelectorAll("[data-maps]").forEach(a => {
  a.href = a.dataset.maps === "directions" ? CONFIG.mapsDirections : CONFIG.mapsPlace;
});
document.querySelectorAll("[data-review]").forEach(a => {
  if (CONFIG.googleReviewUrl) { a.href = CONFIG.googleReviewUrl; a.hidden = false; }
});
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Menú en celular ---------- */
const toggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open);
});
menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  menu.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
}));

/* ---------- Hora actual en Uruguay ---------- */
function ahoraUY() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CONFIG.zonaHoraria, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
  }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  const dia = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get("weekday")];
  return { dia, hora: Number(get("hour")) + Number(get("minute")) / 60 };
}

function textoEstado() {
  const { dia, hora } = ahoraUY();
  const tramos = CONFIG.horarios[dia] || [];
  const actual = tramos.find(([, ini, fin]) => hora >= ini && hora < fin);
  if (!actual) {
    const abreHoy = tramos.length && hora < tramos[0][1];
    return { abierto: false, texto: abreHoy ? `Cerrado ahora · abre hoy a las ${tramos[0][1]}` : "Cerrado ahora · abre mañana a las 6" };
  }
  const [tipo, , fin] = actual;
  const conQuien = tipo === "con" ? "con instructor" : "sin instructor";
  return { abierto: true, texto: `Abierto ahora · ${conQuien} hasta las ${fin}` };
}

function pintarEstado() {
  const el = document.getElementById("heroStatus");
  const { abierto, texto } = textoEstado();
  el.querySelector(".status__text").textContent = texto;
  el.classList.toggle("is-open", abierto);
  el.hidden = false;
}

/* ---------- Gráfico de horarios ---------- */
const week = document.getElementById("week");
function pct(h) { return ((h - ABRE) / (CIERRA - ABRE)) * 100; }

function armarSemana() {
  const corto = window.matchMedia("(max-width: 900px)").matches;
  const { dia: hoy, hora } = ahoraUY();
  let html = '<div class="week__axis" role="row"><span role="columnheader"></span><div class="week__ticks" aria-hidden="true">';
  for (let h = ABRE; h <= CIERRA; h += 2) html += `<span style="left:${pct(h)}%">${h}</span>`;
  html += "</div></div>";

  [1, 2, 3, 4, 5, 6, 0].forEach(d => {
    const tramos = CONFIG.horarios[d];
    const resumen = tramos.map(([t, i, f]) => `de ${i} a ${f} ${t === "con" ? "con" : "sin"} instructor`).join(", ");
    html += `<div class="week__row${d === hoy ? " is-today" : ""}" role="row">
      <span class="week__day" role="rowheader">${corto ? DIAS_CORTOS[d] : DIAS[d]}</span>
      <div class="week__track" role="cell" aria-label="${DIAS[d]}: ${resumen}">`;
    tramos.forEach(([t, i, f], n) => {
      html += `<div class="week__seg week__seg--${t}" style="left:${pct(i)}%;width:${pct(f) - pct(i)}%;transition-delay:${n * 120}ms"><span>${i}–${f}</span></div>`;
    });
    if (d === hoy && hora >= ABRE && hora < CIERRA) {
      html += `<div class="week__now" style="left:${pct(hora)}%" title="Ahora"></div>`;
    }
    html += "</div></div>";
  });
  week.innerHTML = html;
}

armarSemana();
pintarEstado();
setInterval(() => { pintarEstado(); armarSemana(); if (week.dataset.seen) week.classList.add("is-visible"); }, 60000);
let lastNarrow = window.matchMedia("(max-width: 900px)").matches;
window.addEventListener("resize", () => {
  const n = window.matchMedia("(max-width: 900px)").matches;
  if (n !== lastNarrow) { lastNarrow = n; armarSemana(); if (week.dataset.seen) week.classList.add("is-visible"); }
});

if ("IntersectionObserver" in window) {
  new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) { week.classList.add("is-visible"); week.dataset.seen = "1"; obs.disconnect(); }
    });
  }, { threshold: 0.3 }).observe(week);
} else {
  week.classList.add("is-visible");
}

/* ---------- Asistente: ¿qué plan te conviene? ---------- */
(function asistente() {
  const form = document.getElementById("advisorForm");
  const steps = [...form.querySelectorAll(".q")];
  const result = document.getElementById("advisorResult");
  const back = document.getElementById("advisorBack");
  const restart = document.getElementById("advisorRestart");
  let step = 0;

  const OBJ = { mantener: "mantenerte activo", grasa: "bajar grasa", masa: "ganar masa", tonificar: "tonificar" };
  const EXP = { sabe: "ya tenés tu rutina", algo: "sabés un poco cómo entrenar", empieza: "estás empezando" };
  // Mismo dato, en primera persona, para el mensaje de WhatsApp que manda el visitante.
  const OBJ_YO = { mantener: "mantenerme activo", grasa: "bajar grasa", masa: "ganar masa", tonificar: "tonificar" };
  const EXP_YO = { sabe: "ya tengo mi rutina", algo: "sé un poco cómo entrenar", empieza: "estoy empezando" };

  function show(i) {
    step = i;
    steps.forEach((s, n) => s.classList.toggle("is-active", n === i));
    back.hidden = i === 0 || i >= steps.length;
    const first = steps[i] && steps[i].querySelector("input");
    if (first && document.activeElement && document.activeElement.closest("#advisor")) first.focus({ preventScroll: true });
  }

  function recomendar() {
    const v = n => (form.querySelector(`input[name="${n}"]:checked`) || {}).value;
    const exp = v("exp"), obj = v("obj"), seg = v("seg");
    let puntos = 0;
    if (exp === "empieza") puntos += 2;
    if (exp === "algo") puntos += 1;
    if (obj !== "mantener") puntos += 1;
    if (seg === "si") puntos += 2;
    if (seg === "no") puntos -= 1;
    const personalizado = puntos >= 2;

    const plan = personalizado ? "Servicio personalizado" : "Pase libre";
    let why;
    if (personalizado) {
      why = `Como ${EXP[exp]} y querés ${OBJ[obj]}, te sirve tener una rutina armada para tu nivel y que el profe controle tu peso y rendimiento. Además tenés descuento en el plan de nutrición deportiva.`;
    } else {
      why = `Como ${EXP[exp]} y querés ${OBJ[obj]}, con el pase libre tenés toda la sala, las rutinas generales y el asesoramiento de los profes cuando lo necesites.`;
    }
    const when = (personalizado || exp === "empieza")
      ? "Te conviene venir en horario con instructor: de lunes a viernes, de 6 a 10 o de 14 a 22."
      : "Podés venir cuando te quede cómodo: todos los días de 6 a 22.";

    document.getElementById("resultPlan").textContent = plan;
    document.getElementById("resultWhy").textContent = why;
    document.getElementById("resultWhen").textContent = when;
    document.getElementById("resultWa").href = waLink(
      `Hola, vi la web de Valhalla Gimnasio. Me interesa el ${plan}. Quiero ${OBJ_YO[obj]} y ${EXP_YO[exp]}. ¿Me pasan el valor de la cuota?`
    );

    steps.forEach(s => s.classList.remove("is-active"));
    back.hidden = true;
    result.hidden = false;
    result.querySelector(".result__plan").setAttribute("tabindex", "-1");
    result.querySelector(".result__plan").focus({ preventScroll: true });
  }

  form.addEventListener("change", e => {
    if (e.target.type !== "radio") return;
    setTimeout(() => (step < steps.length - 1 ? show(step + 1) : recomendar()), 220);
  });
  back.addEventListener("click", () => show(Math.max(0, step - 1)));
  restart.addEventListener("click", () => {
    form.reset();
    result.hidden = true;
    show(0);
  });
})();

/* ---------- Formulario de contacto (Web3Forms) ---------- */
(function formulario() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const btn = form.querySelector(".form__submit");

  const soloLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
  const correoOk = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function telefonoUY(valor) {
    let d = valor.replace(/[\s\-().]/g, "");
    if (/[^\d+]/.test(d)) return false;
    d = d.replace(/^\+/, "");
    if (d.startsWith("598")) {
      d = d.slice(3);
      return /^9[1-9]\d{6}$/.test(d) || /^[24]\d{7}$/.test(d);
    }
    return /^09[1-9]\d{6}$/.test(d) || /^[24]\d{7}$/.test(d);
  }

  function mensajeReal(t) {
    const txt = t.trim();
    if (txt.length < 15) return "Contanos un poco más (mínimo 15 caracteres).";
    const palabras = txt.split(/\s+/).filter(p => /[a-záéíóúüñ]{2,}/i.test(p));
    if (palabras.length < 3) return "Escribí tu consulta con al menos tres palabras.";
    if (/(.)\1{5,}/.test(txt)) return "El mensaje tiene caracteres repetidos. Escribí tu consulta.";
    return "";
  }

  const reglas = {
    "f-nombre": v => !v.trim() ? "Escribí tu nombre." : !soloLetras.test(v.trim()) ? "El nombre solo puede tener letras." : v.trim().length < 2 ? "Escribí tu nombre completo." : "",
    "f-apellido": v => !v.trim() ? "Escribí tu apellido." : !soloLetras.test(v.trim()) ? "El apellido solo puede tener letras." : v.trim().length < 2 ? "Escribí tu apellido completo." : "",
    "f-correo": v => !v.trim() ? "Escribí tu correo electrónico." : !correoOk.test(v.trim()) ? "Revisá el correo, por ejemplo: nombre@gmail.com." : "",
    "f-telefono": v => !v.trim() ? "Escribí tu teléfono." : !telefonoUY(v) ? "Ingresá un teléfono uruguayo, por ejemplo 099 123 456 o 2xxx xxxx." : "",
    "f-tipo": v => !v ? "Elegí el tipo de consulta." : "",
    "f-mensaje": v => !v.trim() ? "Escribí tu consulta." : mensajeReal(v)
  };
  const errorId = { "f-nombre": "e-nombre", "f-apellido": "e-apellido", "f-correo": "e-correo", "f-telefono": "e-telefono", "f-tipo": "e-tipo", "f-mensaje": "e-mensaje" };

  function validar(input) {
    const msg = reglas[input.id](input.value);
    const box = document.getElementById(errorId[input.id]);
    box.textContent = msg;
    input.closest(".field").classList.toggle("has-error", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    input.setAttribute("aria-describedby", errorId[input.id]);
    return !msg;
  }

  Object.keys(reglas).forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener("blur", () => { if (input.value) validar(input); });
    input.addEventListener("input", () => { if (input.closest(".field").classList.contains("has-error")) validar(input); });
    input.addEventListener("change", () => { if (input.tagName === "SELECT") validar(input); });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.textContent = ""; status.className = "form__status";
    const inputs = Object.keys(reglas).map(id => document.getElementById(id));
    const ok = inputs.map(validar).every(Boolean);
    if (!ok) { inputs.find(i => i.getAttribute("aria-invalid") === "true").focus(); return; }
    if (form.botcheck.checked) return;

    if (!CONFIG.web3formsKey) {
      status.textContent = "El formulario todavía no está activo. Escribinos por WhatsApp.";
      status.classList.add("is-error");
      return;
    }

    const datos = {
      access_key: CONFIG.web3formsKey,
      subject: CONFIG.asuntoMail,
      from_name: "Web Valhalla Gimnasio",
      replyto: document.getElementById("f-correo").value.trim()
    };
    inputs.forEach(i => { datos[i.name] = i.value.trim(); });

    btn.disabled = true; btn.textContent = "Enviando…";
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(datos)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      form.reset();
      inputs.forEach(i => i.closest(".field").classList.remove("has-error"));
      status.textContent = "Consulta enviada. Te respondemos a la brevedad.";
      status.classList.add("is-ok");
    } catch (err) {
      status.textContent = "No se pudo enviar la consulta. Probá de nuevo o escribinos por WhatsApp.";
      status.classList.add("is-error");
    } finally {
      btn.disabled = false; btn.textContent = "Enviar consulta";
    }
  });
})();
