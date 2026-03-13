import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
getAuth,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
getFirestore,
collection,
addDoc,
onSnapshot,
query,
orderBy,
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";



// CONFIG FIREBASE

const firebaseConfig = {
  apiKey: "AIzaSyDy4h_VCmDwMl5hAOPMkiHV2YYq6JkK4Iw",
  authDomain: "messenger-c2da7.firebaseapp.com",
  projectId: "messenger-c2da7",
  storageBucket: "messenger-c2da7.firebasestorage.app",
  messagingSenderId: "173412673396",
  appId: "1:173412673396:web:f4bb795eeeddbd383bee21",
  measurementId: "G-L6RY65X755"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const admins = [
"agent.alan@secure.com",
"agent.andreane@secure.com"
]



/* HORLOGE */

setInterval(()=>{

const d = new Date()

const el = document.getElementById("time")

if(el) el.innerText = d.toLocaleTimeString()

},1000)



/* CHARGEMENT */

let progress = 0

const bar = document.getElementById("bar")
const percent = document.getElementById("percent")

const loading = document.getElementById("loading")
const loginScreen = document.getElementById("login")
const appScreen = document.getElementById("app")


function startLoading(){

const interval = setInterval(()=>{

progress++

if(bar) bar.style.width = progress + "%"

if(percent) percent.innerText = progress + "%"

if(progress >= 100){

clearInterval(interval)

if(loading) loading.dataset.visible = "false"

if(loginScreen) loginScreen.dataset.visible = "true"

}

},40)

}

startLoading()



/* LOGIN */

window.login = async function(){

const user = document.getElementById("user").value
const pass = document.getElementById("pass").value

try{

await signInWithEmailAndPassword(
auth,
user + "@secure.com",
pass
)

loginScreen.dataset.visible="false"
appScreen.dataset.visible="true"

loadMessages()

}catch(e){

alert("ACCES REFUSE")

}

}



/* ENVOI MESSAGE */

window.send = async function(){

const input = document.getElementById("messageInput")

if(!input.value) return

await addDoc(collection(db,"messages"),{

text: input.value,
user: auth.currentUser.email.split("@")[0],
time: Date.now()

})

input.value=""

}



/* RECEPTION MESSAGES */

function loadMessages(){

const q = query(
collection(db,"messages"),
orderBy("time")
)

onSnapshot(q,(snapshot)=>{

const box = document.getElementById("messages")

box.innerHTML=""

snapshot.forEach((docSnap)=>{

const m = docSnap.data()

const div = document.createElement("div")

const current = auth.currentUser.email


if(m.user === current){
div.className = "msg me"
}else{
div.className = "msg"
}

div.innerHTML = `
<div class="meta">${m.user.split("@")[0]}</div>
<div class="body">${m.text}</div>
`

/* bouton suppression admin */

if(admins.includes(auth.currentUser.email)){

const del = document.createElement("button")

del.className = "deleteBtn"

del.innerText = "SUPPRIMER"

del.onclick = async ()=>{

await deleteDoc(docSnap.ref)

}

div.appendChild(del)

}

box.appendChild(div)

})

})

}