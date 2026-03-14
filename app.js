document.querySelectorAll(".step").forEach(step=>{
step.addEventListener("click",()=>{
step.classList.toggle("completed")
updateProgress(step.dataset.group)
})
})

function updateProgress(group){

let steps=document.querySelectorAll(`.step[data-group="${group}"]`)
let completed=[...steps].filter(s=>s.classList.contains("completed")).length
let total=steps.length
let pct=Math.round((completed/total)*100)

let txt=document.getElementById(`prog-${group}-txt`)
let bar=document.getElementById(`prog-${group}-bar`)
let pctLabel=document.getElementById(`prog-${group}-pct`)

if(txt)txt.innerText=`${completed} / ${total}`
if(bar)bar.style.width=pct+"%"
if(pctLabel)pctLabel.innerText=pct+"%"
}

function resetGroup(group){

document.querySelectorAll(`.step[data-group="${group}"]`).forEach(s=>{
s.classList.remove("completed")
})

updateProgress(group)
}

function switchTab(tab){

document.querySelectorAll(".main-tab").forEach(t=>t.classList.remove("active"))
document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"))

document.getElementById(`tab-${tab}`).classList.add("active")
document.getElementById(`panel-${tab}`).classList.add("active")
}

function switchSub(parent,sub){

document.querySelectorAll(`#panel-${parent} .sub-tab`).forEach(t=>t.classList.remove("active"))
document.querySelectorAll(`#panel-${parent} .sub-panel`).forEach(p=>p.classList.remove("active"))

document.getElementById(`subtab-${parent}-${sub}`).classList.add("active")
document.getElementById(`subpanel-${parent}-${sub}`).classList.add("active")
}

function toggleDay(btn){
btn.classList.toggle("selected")
}

function selectPhase(index){

let phases=document.querySelectorAll(".tracker-phase")

phases.forEach(p=>p.classList.remove("current"))

phases[index].classList.add("current")

let desc=document.getElementById("phase-desc")

const texts=[
"Semanas 1-2 — Recuperación de barrera. Solo limpieza + hidratante.",
"Semanas 3-4 — Benzac AC puntual sobre lesiones individuales.",
"Semanas 5-8 — Benzac puede aplicarse en zonas problemáticas.",
"Semana 8+ — Evaluación dermatológica recomendada."
]

desc.innerHTML=texts[index]
}

if("serviceWorker" in navigator){
window.addEventListener("load",()=>{
navigator.serviceWorker.register("sw.js")
})
}
