import { db, auth } from "./firebase.js";

import {
collection,
addDoc,
query,
orderBy,
onSnapshot
}

from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const messagesRef = collection(db,"messages");

window.sendMessage = async function(){

const input = document.getElementById("messageInput");

await addDoc(messagesRef,{

text: input.value,
user: auth.currentUser.email,
date: Date.now()

});

input.value = "";

}

const q = query(messagesRef, orderBy("date"));

onSnapshot(q,(snapshot)=>{

const messagesDiv = document.getElementById("messages");

messagesDiv.innerHTML="";

snapshot.forEach(doc=>{

const m = doc.data();

messagesDiv.innerHTML += `<p><b>${m.user}</b> : ${m.text}</p>`;

});

});