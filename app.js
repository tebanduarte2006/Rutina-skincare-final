const STORAGE_KEY="rutina-progress"
const DATE_KEY="rutina-date"

function saveProgress(){

let completed=[...document.querySelectorAll(".step.completed")].map(s=>s.dataset.group+"-"+s.querySelector(".step-num").innerText)

localStorage.setItem(STORAGE_KEY,JSON.stringify(completed))

}

function loadProgress(){

let data=localStorage.getItem(STORAGE_KEY)

if(!data)return

let completed=JSON.parse(data)

document.querySelectorAll(".step").forEach(step=>{

let id=step.dataset.group+"-"+step.querySelector(".step-num").innerText

if(completed.includes(id)){
step.classList.add("completed")
}

})

}

function checkDailyReset(){

let today=new Date().toDateString()

let saved=localStorage.getItem(DATE_KEY)

if(saved!==today){

localStorage.setItem(DATE_KEY,today)

localStorage.removeItem(STORAGE_KEY)

}

}

document.addEventListener("click",function(e){

let step=e.target.closest(".step")

if(step){

step.classList.toggle("completed")

updateProgress(step.dataset.group)

saveProgress()

}

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

saveProgress()

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

window.addEventListener("load",async()=>{

const reg=await navigator.serviceWorker.register("sw.js")

reg.addEventListener("updatefound",()=>{

const newWorker=reg.installing

newWorker.addEventListener("statechange",()=>{

if(newWorker.state==="installed" && navigator.serviceWorker.controller){

showUpdatePrompt(newWorker)

}

})

})

})

}

function showUpdatePrompt(worker){

let updateBanner=document.createElement("div")

updateBanner.style.position="fixed"
updateBanner.style.bottom="20px"
updateBanner.style.left="20px"
updateBanner.style.right="20px"
updateBanner.style.background="#1d3552"
updateBanner.style.color="white"
updateBanner.style.padding="14px"
updateBanner.style.borderRadius="10px"
updateBanner.style.boxShadow="0 6px 20px rgba(0,0,0,0.3)"
updateBanner.style.fontSize="14px"
updateBanner.style.zIndex="9999"

updateBanner.innerHTML=`
Nueva versión disponible
<button id="updateBtn" style="
margin-left:10px;
background:#3f8ed0;
border:none;
color:white;
padding:6px 10px;
border-radius:6px;
cursor:pointer;
">Actualizar</button>
`

document.body.appendChild(updateBanner)

document.getElementById("updateBtn").addEventListener("click",()=>{

worker.postMessage("SKIP_WAITING")

window.location.reload()

})

}

checkDailyReset()

loadProgress()

document.querySelectorAll(".step").forEach(step=>{
updateProgress(step.dataset.group)
})
