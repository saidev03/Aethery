import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- MOTOR DE CURSOR FLUIDO A 60 FPS (LERP) ---
const cursor = document.getElementById("custom-cursor");

let mouseX = -100, mouseY = -100;
let cursorX = -100, cursorY = -100;
let isCursorInitialized = false;

if (cursor) {
  // Detectar posición real del ratón
  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isCursorInitialized) {
      cursorX = mouseX;
      cursorY = mouseY;
      cursor.classList.add("visible");
      isCursorInitialized = true;
    }
  });

  // Ocultar cuando el ratón sale de la ventana del navegador
  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("visible");
  });

  // Mostrar cuando vuelve a entrar
  document.addEventListener("mouseenter", () => {
    cursor.classList.add("visible");
  });

  // Bucle suave a 60 FPS
  function animateCursor() {
    if (isCursorInitialized) {
      // Interpolación suave (LERP): Factor 0.2 para inercia fluida
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;

      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
    }
    requestAnimationFrame(animateCursor);
  }
  requestAnimationFrame(animateCursor);
}

// --- FORMULARIO DE AUTENTICACIÓN ---
const btnSubmit = document.getElementById("btn-submit-auth");
const accessKeyInput = document.getElementById("access-key");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const statusMsg = document.getElementById("status-msg");

function showStatus(text, isError = false) {
  if (!statusMsg) return;
  statusMsg.innerText = text;
  statusMsg.className = `toast-msg ${isError ? 'toast-error' : 'toast-success'}`;
  statusMsg.style.display = "block";
}

if (btnSubmit) {
  btnSubmit.addEventListener("click", async () => {
    const accessKey = accessKeyInput.value.trim();
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (statusMsg) statusMsg.style.display = "none";

    if (!username || !password) {
      showStatus("Completa el usuario y la contraseña.", true);
      return;
    }

    const userEmail = `${username}@aethery.local`;

    try {
      if (accessKey !== "") {
        const verifyRes = await fetch("/api/verify-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: accessKey })
        });

        const verifyData = await verifyRes.json();

        if (!verifyData.valid) {
          showStatus("Llave inválida o ya utilizada.", true);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          username: username,
          createdAt: new Date().toISOString()
        });

        await setDoc(doc(db, "lockers", `${user.uid}_default`), {
          ownerId: user.uid,
          ownerName: username,
          name: `${username}'s files`,
          isPrivate: true,
          items: [],
          views: 0,
          createdAt: new Date().toISOString()
        });

        showStatus(`¡Cuenta creada! Bienvenido, ${username}.`);
        setTimeout(() => { window.location.reload(); }, 1500);

      } else {
        await signInWithEmailAndPassword(auth, userEmail, password);
        showStatus(`Sesión iniciada como ${username}.`);
      }

    } catch (error) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        showStatus("El usuario ya existe. Para iniciar sesión no pongas llave.", true);
      } else if (error.code === "auth/invalid-credential") {
        showStatus("Usuario o contraseña incorrectos.", true);
      } else {
        showStatus("Error: " + error.message, true);
      }
    }
  });
}
