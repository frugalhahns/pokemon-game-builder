// Cloud save backend: Google sign-in + Firestore, so a kid's wired-up game
// follows them to any device. The API key below is safe to be public - it
// only identifies which Firebase project to talk to; access is actually
// controlled by Firestore's security rules (see firestore.rules) and by
// requiring a signed-in user, not by keeping this key secret.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDaIEC9YxJs7Q2y1BtiYBShrIqpPDVVcIs',
  authDomain: 'pokemon-game-builder.firebaseapp.com',
  projectId: 'pokemon-game-builder',
  storageBucket: 'pokemon-game-builder.firebasestorage.app',
  messagingSenderId: '1011410353059',
  appId: '1:1011410353059:web:3fce96a9d442808bfff816',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function signIn() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOut() {
  return firebaseSignOut(auth);
}

function slugify(name) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base || 'game'}-${Date.now().toString(36)}`;
}

export async function saveGame(uid, name, graphData) {
  const saveId = slugify(name);
  await setDoc(doc(db, 'users', uid, 'saves', saveId), {
    name,
    graph: graphData,
    updatedAt: serverTimestamp(),
  });
  return saveId;
}

export async function listSaves(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'saves'));
  const saves = [];
  snapshot.forEach((docSnap) => {
    saves.push({ id: docSnap.id, ...docSnap.data() });
  });
  saves.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
  return saves;
}

export async function deleteSave(uid, saveId) {
  await deleteDoc(doc(db, 'users', uid, 'saves', saveId));
}
