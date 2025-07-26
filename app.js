import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.3/firebase-app.js";
import { getFirestore, getDocs, collection, addDoc, query, where, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.8.3/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDnWz3jqg8kkffoI4idup1ACMjc3rrv_Ys",
    authDomain: "app-bolsos.firebaseapp.com",
    projectId: "app-bolsos",
    storageBucket: "app-bolsos.firebasestorage.com",
    messagingSenderId: "916888332391",
    appId: "1:916888332391:web:4305bfd5b086d7a1b34cc2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const marcas = ["Tronks", "Gema", "Motta", "Extreme", "Reno", "Najos", "Beks", "Yal", "Jhofro", "RDA", "Importada"];

const marcasContainer = document.getElementById("marcasContainer");
const referenciasContainer = document.getElementById("referenciasContainer");
const searchInput = document.getElementById("searchInput");

const modalAgregar = document.getElementById("modalAgregar");
const btnAbrirModal = document.getElementById("btnAbrirModal");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const btnGuardarBolso = document.getElementById("btnGuardarBolso");

marcas.forEach(marca => {
    const btn = document.createElement("button");
    btn.textContent = marca;
    btn.className = "btn btn-sm bg-[var(--barbiePinkLight)] border-2 rounded-full px-4 py-3 text-white hover:bg-[var(--barbiePinkDark)] shadow";
    btn.onclick = () => mostrarPorMarca(marca);
    marcasContainer.appendChild(btn);
})

async function mostrarPorMarca(marcaSeleccionada) {
    referenciasContainer.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "bolsos"));

    const bolsos = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.marca === marcaSeleccionada) {
            bolsos.push(data);
        }
    });

    if (bolsos.length === 0) {
        referenciasContainer.innerHTML = `<p class="text-center text-gray-500 italic">No hay bolsos registrados para esta marca aún.</p>`;
        return;
    }
    bolsos.forEach(bolso => {
        const item = document.createElement("div");
        item.className = "bg-white border-l-4 border-[var(--barbiePink)] p-3 my-2 rounded shadow text-sm";
        item.textContent = `Ref: ${bolso.referencia} - $${bolso.precio.toLocaleString()}`;
        referenciasContainer.appendChild(item);
    })
}

searchInput.addEventListener("input", async () => {
    const filtro = searchInput.value.toLowerCase();
    referenciasContainer.innerHTML = "";

    if (filtro === "") {
        referenciasContainer.innerHTML = `<p class="text-center italic text-[var(--barbiePinkLighter)]">Selecciona una marca o busca algo en la barra</p>`;
        return;
    }

    const querySnapshot = await getDocs(collection(db, "bolsos"));
    const resultados = [];

    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (
            data.referencia.toLowerCase().includes(filtro) ||
            data.marca.toLowerCase().includes(filtro)
        ) {
            if (!resultados[data.marca]) resultados[data.marca] = [];
            resultados[data.marca].push(data);
        }
    })

    if (Object.keys(resultados).length === 0) {
        referenciasContainer.innerHTML = `<p class="text-center text-gray-500 italic">No hay bolsos registrados para esta marca aún.</p>`;
        return;
    }
    Object.keys(resultados).forEach(marca => {
        const header = document.createElement("h3");
        header.className = "font-bold mt-4 text-[var(--barbiePinkDark)]";
        header.textContent = marca;
        referenciasContainer.appendChild(header);

        resultados[marca].forEach(bolso => {
            const item = document.createElement("div");
            item.className = "bg-white border-l-4 border-[var(--barbiePink)] p-2 my-1 rounded shadow text-sm";
            item.textContent = `Ref: ${bolso.referencia} - $${bolso.precio.toLocaleString()}`;
            referenciasContainer.appendChild(item);
        })
    })
})

btnAbrirModal.addEventListener("click", () => modalAgregar.classList.remove("hidden"));
btnCerrarModal?.addEventListener("click", () => modalAgregar.classList.add("hidden"));


btnGuardarBolso.addEventListener("click", async () => {
    const marca = document.getElementById("inputMarca").value;
    const referencia = document.getElementById("inputReferencia").value;
    const precio = document.getElementById("inputPrecio").value;

    if (!marca || !referencia || isNaN(precio)) {
        alert("Por favor, rellena todos los campos");
        return;
    }

    await addDoc(collection(db, "bolsos"), {
        marca,
        referencia,
        precio
    })
    document.getElementById("inputMarca").value = "";
    document.getElementById("inputReferencia").value = "";
    document.getElementById("inputPrecio").value = "";
    modalAgregar.classList.add("hidden");
    alert("Bolso agregado con éxito");

    if (searchInput.value)
        searchInput.dispatchEvent(new Event("input"));
})
document.getElementById("btnAbrirModalEditar").addEventListener("click", async () => {
    document.getElementById("modalEditar").showModal();

    const marcasSet = new Set();
    const querySnapshot = await getDocs(collection(db, "bolsos"));
    querySnapshot.forEach(doc => {
        marcasSet.add(doc.data().marca);
    });

    const marcaSelect = document.getElementById("marcaEditar");
    marcaSelect.innerHTML = '<option value="">Selecciona una marca</option>';
    marcasSet.forEach(marca => {
        marcaSelect.innerHTML += `<option value="${marca}">${marca}</option>`;
    });
});

// Al cambiar la marca, mostrar referencias
document.getElementById("marcaEditar").addEventListener("change", async (e) => {
    const marcaSeleccionada = e.target.value;
    const referenciaSelect = document.getElementById("referenciaEditar");
    referenciaSelect.innerHTML = '<option value="">Selecciona una referencia</option>';

    const q = query(collection(db, "bolsos"), where("marca", "==", marcaSeleccionada));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
        referenciaSelect.innerHTML += `<option value="${doc.id}">${doc.data().referencia}</option>`;
    });
});

// Al seleccionar la referencia, mostrar precio actual
document.getElementById("referenciaEditar").addEventListener("change", async (e) => {
    const docId = e.target.value;
    const docRef = doc(db, "bolsos", docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        document.getElementById("precioEditar").value = docSnap.data().precio;
    }
});

// Guardar el cambio
document.getElementById("guardarCambioBtn").addEventListener("click", async () => {
    const docId = document.getElementById("referenciaEditar").value;
    const nuevoPrecio = document.getElementById("precioEditar").value;

    if (!docId || !nuevoPrecio) {
        alert("Faltan datos por completar");
        return;
    }

    await updateDoc(doc(db, "bolsos", docId), {
        precio: nuevoPrecio
    });

    alert("Precio actualizado ✅");
    document.getElementById("modalEditar").close();
    document.getElementById("precioEditar").value = "";
    document.getElementById("marcaEditar").value = "";
    document.getElementById("referenciaEditar").innerHTML = '<option value="">Selecciona una referencia</option>';
});
