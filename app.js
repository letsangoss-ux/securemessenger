import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
getAuth,
signInWithEmailAndPassword,
signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
getFirestore,
collection,
addDoc,
onSnapshot,
query,
orderBy,
deleteDoc,
updateDoc
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

// liste des identifiants utilisés pour les chats
const allUsers = [
  'agent.alan',
  'agent.andreane'
];

let currentChatType = 'group'; // 'group' or 'private'
let privateUser = null;



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

loadUsers()
loadMessages()

}catch(e){

alert("ACCES REFUSE")

}

}



/* CHARGER UTILISATEURS */

function loadUsers(){
  const current = auth.currentUser.email.split("@")[0];
  const filtered = allUsers.filter(u => u !== current);
  const list = document.getElementById("userList");
  list.innerHTML = "";
  filtered.forEach(u => {
    const div = document.createElement("div");
    div.className = "user";
    div.onclick = () => startPrivateChat(u);
    // afficher juste la partie après le point et capitaliser
    const pretty = u.split('.')
      .slice(-1)[0]
      .replace(/^./, c => c.toUpperCase());
    div.innerText = pretty;
    list.appendChild(div);
  });
}



/* DECONNEXION */

window.logout = async function(){
await signOut(auth);
location.reload();
}



/* COMMENCER CHAT PRIVE */

window.startPrivateChat = function(userPrefix){
  currentChatType = 'private';
  privateUser = userPrefix;
  loadMessages();
  const title = document.querySelector('.chat-title');
  const pretty = userPrefix.split('.')
    .slice(-1)[0]
    .replace(/^./, c => c.toUpperCase());
  title.innerText = `CHAT PRIVE AVEC ${pretty}`;
}



/* REVENIR AU GROUPE */

window.switchToGroup = function(){
  currentChatType = 'group';
  privateUser = null;
  loadMessages();
  loadUsers();
  const title = document.querySelector('.chat-title');
  title.innerText = 'MESSAGERIE SECURISEE';
}



/* EDITER MESSAGE */

window.editMessage = async function(ref, oldText){
const newText = prompt("Modifier le message:", oldText);
if(newText && newText !== oldText){
await updateDoc(ref, {
text: newText,
modified: true
});
}
}



/* ENVOI MESSAGE */

window.send = async function(){

const input = document.getElementById("messageInput")

if(!input.value) return

let collectionName = "messages";
if(currentChatType === 'private'){
const users = [auth.currentUser.email.split("@")[0], privateUser].sort();
collectionName = `private_${users[0]}_${users[1]}`;
}

await addDoc(collection(db, collectionName),{

text: input.value,
user: auth.currentUser.email.split("@")[0],
timestamp: Date.now()

})

input.value=""

}



/* RECEPTION MESSAGES */

function loadMessages(){

let collectionName = "messages";
if(currentChatType === 'private'){
const users = [auth.currentUser.email.split("@")[0], privateUser].sort();
collectionName = `private_${users[0]}_${users[1]}`;
}

const q = query(
collection(db, collectionName),
orderBy("timestamp")
)

onSnapshot(q,(snapshot)=>{

const box = document.getElementById("messages")

box.innerHTML=""

snapshot.forEach((docSnap)=>{

const m = docSnap.data()

const div = document.createElement("div")

const current = auth.currentUser.email.split("@")[0]


if(m.user === current){
div.className = "msg me"
}else{
div.className = "msg"
}

let modifiedText = "";
if(m.modified){
modifiedText = " (modifié)";
}

div.innerHTML = `
<div class="meta">${m.user}${modifiedText}</div>
<div class="body">${m.text}</div>
`

/* bouton modifier pour ses propres messages */
if(m.user === current){
const editBtn = document.createElement("button");
editBtn.className = "editBtn";
editBtn.innerText = "MODIFIER";
editBtn.onclick = () => editMessage(docSnap.ref, m.text);
div.appendChild(editBtn);
}

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
