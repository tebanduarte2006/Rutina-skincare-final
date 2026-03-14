const steps=document.querySelectorAll(".step")

function toggleStep(step){

step.classList.toggle("checked")

saveProgress()

if(navigator.vibrate){
navigator.vibrate(20)
}

}

document.addEventListener("click",function(e){

const step=e.target.closest(".step")

if(!step)return

toggleStep(step)

})

function saveProgress(){

const state=[]

document.querySelectorAll(".step").forEach((step,i)=>{

state[i]=step.classList.contains("checked")

})

localStorage.setItem("routine-state",JSON.stringify(state))

}

function loadProgress(){

const state=JSON.parse(localStorage.getItem("routine-state")||"[]")

document.querySelectorAll(".step").forEach((step,i)=>{

if(state[i])step.classList.add("checked")

})

}

function dailyReset(){

const today=new Date().toDateString()

const last=localStorage.getItem("routine-date")

if(last!==today){

localStorage.removeItem("routine-state")

localStorage.setItem("routine-date",today)

}

}

loadProgress()

dailyReset()

if("serviceWorker" in navigator){

window.addEventListener("load",async()=>{

const reg=await navigator.serviceWorker.register("./sw.js")

reg.addEventListener("updatefound",()=>{

const worker=reg.installing

worker.addEventListener("statechange",()=>{

if(worker.state==="installed" && navigator.serviceWorker.controller){

showUpdatePrompt(worker)

}

})

})

})

}

function showUpdatePrompt(worker){

const banner=document.createElement("div")

banner.style.position="fixed"
banner.style.bottom="20px"
banner.style.left="20px"
banner.style.right="20px"
banner.style.background="#173554"
banner.style.color="white"
banner.style.padding="14px"
banner.style.borderRadius="10px"
banner.style.zIndex="9999"

banner.innerHTML=`Nueva versión disponible 
<button id="updateBtn">Actualizar</button>`

document.body.appendChild(banner)

document.getElementById("updateBtn").addEventListener("click",()=>{

worker.postMessage("SKIP_WAITING")

window.location.reload()

})

}
