/* NZT-25 | RESET — dados do protocolo e cálculo do "agora".
   Compartilhado entre o app (index.html) e o widget (widget.html).
   Puro: sem DOM, sem armazenamento. */
"use strict";

const DEFAULT_START = "2026-11-10"; // Dia 1 do protocolo
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parseISO = s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); };
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

const PROTOCOL = {
  totalDays: 25,
  phases: [
    { from:1,  to:5,  name:"Recuperar controle",        desc:"Estabilizar horários, sono e o momento da manhã." },
    { from:6,  to:10, name:"Quebrar padrões",           desc:"Identificar e interromper os gatilhos de dispersão." },
    { from:11, to:18, name:"Construir nova identidade", desc:"Repetir o essencial até virar o modo padrão." },
    { from:19, to:25, name:"Consolidar",                desc:"Manter com menos esforço e ajustar o que não encaixou." },
  ],
  // getDay(): 0=dom ... 6=sáb
  dayTypes: {
    1:"gym", 3:"gym", 5:"gym",
    2:"walk", 4:"walk",
    6:"sat", 0:"sun",
  },
  typeLabel: { gym:"Academia", walk:"Caminhada / mobilidade", sat:"Atividade livre", sun:"Descanso" },
  book: { title:"Morra sem nada", days:4, pagesPerDay:10 },
};

function weekdayAgenda(type){
  const morning = type === "gym"
    ? { h:"06:40", t:"Academia", d:"Treino; depois retorno, banho e café da manhã." }
    : { h:"06:40", t:"Caminhada ou mobilidade", d:"20–30 min; depois banho e café da manhã." };
  return [
    { h:"05:45", t:"Acordar", d:"Água e higiene." },
    { h:"05:55", t:"Bíblia e oração", d:"20 minutos." },
    { h:"06:15", t:"Preparar-se" },
    ...(type === "gym" ? [{ h:"06:30", t:"Deslocamento", d:"10 minutos até a academia." }] : []),
    morning,
    { h:"08:20", t:"Planejar a entrega principal", d:"Uma entrega concreta antes das calls." },
    { h:"09:00", e:"11:00", t:"Calls e reuniões" },
    { h:"11:00", t:"Bloco de foco", d:"Começar a entrega principal, sem distrações." },
    { h:"13:00", t:"Almoço e pausa" },
    { h:"14:00", t:"Execução" },
    { h:"16:30", t:"Fechamento do expediente", d:"Concluído, pendente e primeiro passo de amanhã." },
    { h:"17:00", t:"Vida pessoal" },
    { h:"20:45", t:"Desacelerar", d:"Reduzir telas e preparar o dia seguinte." },
    { h:"21:45", t:"Dormir", d:"Proteger 8 horas de sono." },
  ];
}
function weekendAgenda(type){
  const list = [
    { h:"Manhã", t:"Acordar sem obrigação de horário", d:"Água e higiene ao levantar." },
    { h:"Manhã", t:"Momento com Deus", d:"Bíblia e oração, no ritmo do dia." },
    type === "sat"
      ? { h:"Livre", t:"Atividade física livre", d:"Algo que mova o corpo, sem roteiro." }
      : { h:"Livre", t:"Descanso", d:"Recuperação. Um passeio leve é opcional." },
    { h:"Dia", t:"Refeições equilibradas", d:"Mesmo cuidado dos dias úteis." },
    { h:"Tarde", t:"Vida pessoal" },
    { h:"Noite", t:"Desacelerar", d:"Reduzir telas no início da noite." },
  ];
  list.push(type === "sun"
    ? { h:"21:45", t:"Dormir", d:"Prepara o despertar de segunda." }
    : { h:"Noite", t:"Dormir", d:"Em horário que proteja 8 horas de sono." });
  return list;
}

function buildMissions(dayN, type){
  const weekday = type === "gym" || type === "walk";
  const m = [];
  m.push({ id:"deus", t:"Momento com Deus", s: weekday ? "Bíblia e oração, 20 min às 05:55." : "Bíblia e oração, no horário que fizer sentido." });
  const phys = {
    gym:  { t:"Academia", s:"Treino às 06:40." },
    walk: { t:"Caminhada ou mobilidade", s:"20–30 min às 06:40." },
    sat:  { t:"Atividade livre", s:"Mover o corpo do jeito que preferir." },
    sun:  { t:"Descanso", s:"Recuperação. Nada a cumprir além de descansar." },
  }[type];
  m.push({ id:"fisico", ...phys });
  if (weekday){
    m.push({ id:"entrega", t:"Definir a entrega principal", s:"Antes das 09:00 — uma entrega concreta." });
    m.push({ id:"foco", t:"Bloco de foco após as calls", s:"A partir das 11:00, na entrega definida." });
  }
  m.push({ id:"alimentacao", t:"Alimentação equilibrada", s: weekday ? "Refeições regulares e completas." : "Manter o equilíbrio também no fim de semana." });
  m.push({ id:"cafe", t:"Observar o café", s:"Registrar as xícaras e reduzir aos poucos, sem corte abrupto.", coffee:true });
  if (dayN <= PROTOCOL.book.days){
    const done = (dayN - 1) * PROTOCOL.book.pagesPerDay;
    m.push({ id:"leitura", t:`Ler 10 páginas — ${PROTOCOL.book.title}`, s:`Parte ${dayN} de ${PROTOCOL.book.days} · ${40 - done} páginas restantes antes de hoje.` });
  } else {
    m.push({ id:"leitura", t:"Leitura pessoal", s:"10–15 minutos." });
  }
  if (weekday) m.push({ id:"fechamento", t:"Fechar o expediente", s:"16:30 — registrar concluído, pendente e primeiro passo." });
  if (type === "sat") m.push({ id:"sono", t:"Desacelerar e dormir cedo", s:"Horário flexível, protegendo 8 horas de sono." });
  else m.push({ id:"sono", t:"Desacelerar e dormir às 21:45", s:"Desacelerar a partir das 20:45." });
  return m;
}


/* ---------- "Agora": bloco atual da rotina para um instante qualquer ---------- */
const hm = s => { const m = /^(\d{2}):(\d{2})$/.exec(s); return m ? +m[1]*60 + +m[2] : null; };
const fmtHM = m => `${String(Math.floor(m/60) % 24).padStart(2,"0")}:${String(m % 60).padStart(2,"0")}`;
const typeForDate = d => PROTOCOL.dayTypes[d.getDay()];
const isWorkday = t => t === "gym" || t === "walk";
function dayIndexFor(d, startISO){
  return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - parseISO(startISO)) / 864e5) + 1;
}

// Linha do tempo do dia em minutos. Dias úteis seguem os horários fixos;
// fim de semana usa janelas aproximadas e é marcado como flexível.
function timelineFor(d){
  const type = typeForDate(d);
  let items;
  if (isWorkday(type)){
    items = [{ start:0, t:"Sono", d:"Proteger as 8 horas. Despertar às 05:45." }]
      .concat(weekdayAgenda(type).map(it => ({ start:hm(it.h), t:it.t, d:it.d || "" })));
  } else if (type === "sat"){
    items = [
      { start:0,    t:"Sono", d:"Sem despertador obrigatório." },
      { start:480,  t:"Manhã livre", d:"Momento com Deus e atividade livre, no seu ritmo." },
      { start:720,  t:"Tarde", d:"Vida pessoal. Refeições equilibradas." },
      { start:1080, t:"Noite", d:"Desacelerar quando fizer sentido." },
      { start:1320, t:"Dormir", d:"Proteger 8 horas de sono." },
    ];
  } else {
    items = [
      { start:0,    t:"Sono", d:"Sem despertador obrigatório." },
      { start:480,  t:"Manhã de descanso", d:"Momento com Deus. Descanso, sem roteiro." },
      { start:720,  t:"Tarde", d:"Vida pessoal. Refeições equilibradas." },
      { start:1080, t:"Noite", d:"Vida pessoal, sem pressa." },
      { start:1245, t:"Desacelerar", d:"Reduzir telas e preparar a segunda-feira." },
      { start:1305, t:"Dormir", d:"Segunda começa às 05:45." },
    ];
  }
  items.forEach((it,i) => it.end = i < items.length-1 ? items[i+1].start : 1440);
  return { type, flexible: !isWorkday(type), items };
}

function nowBlock(now, startISO){
  const today = timelineFor(now);
  const mins = now.getHours()*60 + now.getMinutes();
  const idx = today.items.reduce((acc,it,i) => it.start <= mins ? i : acc, 0);
  const cur = today.items[idx];
  const tomorrow = timelineFor(addDays(now, 1));
  const wakeTomorrow = tomorrow.items[1];
  const next = idx < today.items.length-1
    ? { t: today.items[idx+1].t, h: fmtHM(today.items[idx+1].start) }
    : { t: wakeTomorrow.t, h: tomorrow.flexible ? "amanhã" : fmtHM(wakeTomorrow.start) };

  let range, left, frac;
  if (idx === 0){                       // madrugada
    range = today.flexible ? "até acordar" : "até " + fmtHM(cur.end);
    left = cur.end - mins; frac = mins / cur.end;
  } else if (cur.end === 1440){         // último bloco: atravessa a meia-noite
    const endNext = tomorrow.flexible ? null : wakeTomorrow.start;
    range = fmtHM(cur.start) + (endNext != null ? " – " + fmtHM(endNext) : " – manhã");
    left = endNext != null ? (1440 - mins) + endNext : null;
    frac = endNext != null ? (mins - cur.start) / ((1440 - cur.start) + endNext) : null;
  } else {
    range = fmtHM(cur.start) + " – " + fmtHM(cur.end);
    left = cur.end - mins; frac = (mins - cur.start) / (cur.end - cur.start);
  }
  const dayN = dayIndexFor(now, startISO);
  const inProtocol = dayN >= 1 && dayN <= PROTOCOL.totalDays;
  const phase = inProtocol ? PROTOCOL.phases.find(p => dayN >= p.from && dayN <= p.to) : null;
  return {
    dayN, inProtocol, phase, phaseIndex: phase ? PROTOCOL.phases.indexOf(phase) + 1 : null,
    type: today.type, typeLabel: PROTOCOL.typeLabel[today.type], flexible: today.flexible,
    t: cur.t, d: cur.d, range, next, minsLeft: left, frac: frac == null ? null : Math.max(0, Math.min(1, frac)),
    clock: fmtHM(mins),
  };
}
function fmtLeft(m){
  if (m == null) return "";
  if (m < 60) return `${m} min restantes`;
  const h = Math.floor(m/60), r = m % 60;
  return r ? `${h} h ${r} min restantes` : `${h} h restantes`;
}
