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
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";



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
const storage = getStorage(app);
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
let notifications = {}; // prefix -> bool indicating unread message

function markNotification(userPrefix){
  notifications[userPrefix] = true;
  renderUserList();
}

async function uploadFile(file){
  const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
}

function clearNotification(userPrefix){
  if(notifications[userPrefix]){
    delete notifications[userPrefix];
    renderUserList();
  }
}



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

      loginScreen.dataset.visible = "false"
      appScreen.dataset.visible = "true"

      loadUsers()
      setupPrivateListeners();
      loadMessages()

}catch(e){

alert("ACCES REFUSE")

}

}



/* CHARGER UTILISATEURS */

function renderUserList(){
  const current = auth.currentUser.email.split("@")[0];
  const filtered = allUsers.filter(u => u !== current);
  const list = document.getElementById("userList");
  list.innerHTML = "";

  // entrée groupe
  const grp = document.createElement('div');
  grp.className = 'user group';
  grp.innerText = 'GROUPE';
  grp.onclick = () => switchToGroup();
  list.appendChild(grp);

  filtered.forEach(u => {
    const div = document.createElement("div");
    div.className = "user";
    div.onclick = () => startPrivateChat(u);
    const pretty = u.split('.')
      .slice(-1)[0]
      .replace(/^./, c => c.toUpperCase());
    div.innerText = pretty;
    if(notifications[u]){
      const badge = document.createElement('span');
      badge.className = 'badge';
      div.appendChild(badge);
    }
    list.appendChild(div);
  });
}


/* listeners pour toutes les conversations privées */

function setupPrivateListeners(){
  const current = auth.currentUser.email.split("@")[0];
  allUsers.filter(u => u !== current).forEach(other => {
    const users = [current, other].sort();
    const coll = collection(db, `private_${users[0]}_${users[1]}`);
    const q = query(coll, orderBy("timestamp"));
    onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        if(change.type === 'added'){
          const m = change.doc.data();
          if(m.user !== current){
            if(!(currentChatType === 'private' && privateUser === other)){
              markNotification(other);
            }
          }
        }
      });
    });
  });
}

function loadUsers(){
  renderUserList();
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
  clearNotification(userPrefix);
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



/* VIDER FICHIER */

window.clearFile = function(){
  document.getElementById("fileInput").value = "";
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
  const input = document.getElementById("messageInput");
  const fileInput = document.getElementById("fileInput");

  if(!input.value && !fileInput.files.length) return;

  let collectionName = "messages";
  if(currentChatType === 'private'){
    const users = [auth.currentUser.email.split("@")[0], privateUser].sort();
    collectionName = `private_${users[0]}_${users[1]}`;
    // clear notification when sending to someone you are already chatting with
    clearNotification(privateUser);
  }

  const messageObj = {
    user: auth.currentUser.email.split("@")[0],
    timestamp: Date.now()
  };
  if(input.value) messageObj.text = input.value;
  if(fileInput.files.length){
    const file = fileInput.files[0];
    try {
      // upload to storage before sending
      const url = await uploadFile(file);
      messageObj.fileURL = url;
      messageObj.fileName = file.name;
      await addDoc(collection(db, collectionName), messageObj);
    } catch (error) {
      alert("Erreur lors de l'envoi du fichier : " + error.message);
      return; // ne pas vider si erreur
    }
  } else {
    await addDoc(collection(db, collectionName), messageObj);
  }

  input.value = "";
  fileInput.value = "";
};



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
  const m = docSnap.data();
  const div = document.createElement("div");
  const current = auth.currentUser.email.split("@")[0];

  if(m.user === current){
    div.className = "msg me";
  } else {
    div.className = "msg";
  }

  let modifiedText = "";
  if(m.modified){
    modifiedText = " (modifié)";
  }

  let bodyHtml = m.text ? m.text : "";
  if(m.fileURL){
    // display based on extension detected from fileName
    const ext = m.fileName.split('.').pop().toLowerCase();
    if(['png','jpg','jpeg','gif','webp','bmp'].includes(ext)){
      bodyHtml += `<br><img src="${m.fileURL}" alt="${m.fileName}" style="max-width:200px;">`;
    } else {
      bodyHtml += `<br><a href="${m.fileURL}" target="_blank">Télécharger ${m.fileName}</a>`;
    }
  }

  div.innerHTML = `
<div class="meta">${m.user}${modifiedText}</div>
<div class="body">${bodyHtml}</div>
`;

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
    const del = document.createElement("button");
    del.className = "deleteBtn";
    del.innerText = "SUPPRIMER";
    del.onclick = async ()=>{
      await deleteDoc(docSnap.ref);
    };
    div.appendChild(del);
  }

  box.appendChild(div);
  // notification logic
  if(currentChatType === 'private' && m.user !== current && m.user === privateUser){
    // when viewing the chat with the sender, clear notification
    clearNotification(m.user);
  } else if(currentChatType === 'group' && m.user !== current){
    // not in chat with sender
    markNotification(m.user);
  } else if(currentChatType==='private' && m.user!==current && m.user!==privateUser){
    markNotification(m.user);
  }
});

})

}
