import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://mozvgbodcknmmmbvplft.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QUpdX5VFX6VusQTN-MgjTQ_F2XhxKFs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 toast-container";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    toast.className = `${bg} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-10 opacity-0`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove("translate-y-10", "opacity-0"); }, 10);
    setTimeout(() => { toast.classList.add("translate-y-10", "opacity-0"); setTimeout(() => toast.remove(), 300); }, 3000);
}

function customConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center";
        overlay.innerHTML = `
            <div class="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 text-center">
                <h3 class="text-lg font-bold text-gray-900 mb-2">⚠️ Confirmación</h3>
                <p class="text-gray-600 mb-6">${message}</p>
                <div class="flex justify-center gap-3">
                    <button class="cancel-btn px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">Cancelar</button>
                    <button class="accept-btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">Aceptar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector(".accept-btn").onclick = () => { resolve(true); overlay.remove(); };
        overlay.querySelector(".cancel-btn").onclick = () => { resolve(false); overlay.remove(); };
    });
}

function toggleLoader(show) {
    let loader = document.getElementById("globalLoader");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "globalLoader";
        loader.className = "fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] hidden items-center justify-center";
        loader.innerHTML = `<div class="animate-spin rounded-full h-12 w-12 border-4 border-sanmarcos-red border-t-transparent"></div>`;
        document.body.appendChild(loader);
    }
    loader.style.display = show ? "flex" : "none";
}

const navItems = document.querySelectorAll('.nav-item');
const adminSections = document.querySelectorAll('.admin-section');
const titulos = {
    'sec-noticias': 'Módulo de Noticias y Comunicados',
    'sec-proyectos': 'Gestión de Proyectos de Alumnos',
    'sec-docentes': 'Directorio Docente Institucional',
    'sec-config': 'Configuración del Portal'
};

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(n => { n.classList.remove('bg-sanmarcos-red', 'text-white', 'shadow-md'); n.classList.add('text-gray-600', 'hover:bg-sanmarcos-light', 'hover:text-sanmarcos-red'); });
        item.classList.remove('text-gray-600', 'hover:bg-sanmarcos-light', 'hover:text-sanmarcos-red'); item.classList.add('bg-sanmarcos-red', 'text-white', 'shadow-md');
        const targetId = item.getAttribute('data-target');
        adminSections.forEach(sec => sec.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');
        document.getElementById('tituloHeader').innerText = titulos[targetId];
    });
});

async function verificarSesion() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && !window.location.href.includes("login.html")) {
        window.location.href = "login.html";
    } else if (session) {
        cargarNoticias(); cargarProyectos(); cargarDocentes(); cargarConfiguracion();
    }
}
window.logout = async function() { await supabase.auth.signOut(); window.location.href = "login.html"; };
document.addEventListener("DOMContentLoaded", verificarSesion);

// ==========================================
// 📰 1. MÓDULO DE NOTICIAS
// ==========================================
let noticiaId = null;
window.limpiarFormularioNoticia = function() {
    noticiaId = null; document.getElementById("tituloNoticia").value = ""; document.getElementById("categoriaNoticia").value = "Comunicado Oficial";
    document.getElementById("fechaNoticia").value = ""; document.getElementById("autorNoticia").value = ""; document.getElementById("contenidoNoticia").value = "";
    document.getElementById("img1-txt").innerText = "Subir Imagen Destacada"; document.getElementById("img2-txt").innerText = "Imagen 2 (Opcional)"; document.getElementById("img3-txt").innerText = "Imagen 3 (Opcional)";
}

async function cargarNoticias() {
    const tbody = document.getElementById("tablaNoticiasBody");
    const { data, error } = await supabase.from("noticias").select("*").order("fecha_publicacion", { ascending: false });
    if (error) return;
    tbody.innerHTML = "";
    data.forEach(n => {
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b border-gray-100">
                <td class="px-6 py-4 flex items-center"><img src="${n.imagen1_url || 'https://via.placeholder.com/100'}" class="h-10 w-10 rounded-lg object-cover mr-3"><div><p class="font-bold text-gray-900">${n.titulo}</p><p class="text-xs text-gray-500">${n.autor}</p></div></td>
                <td class="px-6 py-4"><span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">${n.categoria}</span></td>
                <td class="px-6 py-4 text-gray-600">${n.fecha_publicacion}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editarNoticia('${n.id}')" class="text-blue-500 hover:text-blue-700 p-2"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="eliminarNoticia('${n.id}', '${n.imagen1_path}', '${n.imagen2_path}', '${n.imagen3_path}')" class="text-red-500 hover:text-red-700 p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`;
    }); lucide.createIcons();
}

document.getElementById("btnGuardarNoticia")?.addEventListener("click", async () => {
    const titulo = document.getElementById("tituloNoticia").value.trim(); const contenido = document.getElementById("contenidoNoticia").value.trim(); const fecha = document.getElementById("fechaNoticia").value;
    if (!titulo || !fecha || !contenido) return showToast("Faltan datos obligatorios", "error");
    toggleLoader(true);
    let payload = { titulo, categoria: document.getElementById("categoriaNoticia").value, fecha_publicacion: fecha, autor: document.getElementById("autorNoticia").value, contenido };
    
    for (let i = 1; i <= 3; i++) {
        const file = document.getElementById(`imagenNoticia${i}`)?.files[0];
        if (file) {
            const path = `noticia_${Date.now()}_img${i}_${file.name}`;
            await supabase.storage.from("archivos_unmsm").upload(path, file);
            payload[`imagen${i}_url`] = supabase.storage.from("archivos_unmsm").getPublicUrl(path).data.publicUrl;
            payload[`imagen${i}_path`] = path;
        }
    }
    noticiaId ? await supabase.from("noticias").update(payload).eq("id", noticiaId) : await supabase.from("noticias").insert([payload]);
    toggleLoader(false); showToast("Noticia guardada", "success"); limpiarFormularioNoticia(); document.getElementById('formNoticiaCard').classList.add('hidden'); cargarNoticias();
});

window.editarNoticia = async function(id) {
    toggleLoader(true); const { data } = await supabase.from("noticias").select("*").eq("id", id).single(); toggleLoader(false);
    noticiaId = id; document.getElementById("tituloNoticia").value = data.titulo; document.getElementById("categoriaNoticia").value = data.categoria;
    document.getElementById("fechaNoticia").value = data.fecha_publicacion; document.getElementById("autorNoticia").value = data.autor; document.getElementById("contenidoNoticia").value = data.contenido;
    document.getElementById("formNoticiaCard").classList.remove("hidden"); window.scrollTo(0,0);
}

window.eliminarNoticia = async function(id, p1, p2, p3) {
    if (!await customConfirm("¿Eliminar noticia?")) return;
    toggleLoader(true);
    const paths = [p1, p2, p3].filter(p => p && p !== 'null' && p !== 'undefined');
    if (paths.length > 0) await supabase.storage.from("archivos_unmsm").remove(paths);
    await supabase.from("noticias").delete().eq("id", id);
    toggleLoader(false); showToast("Eliminado", "success"); cargarNoticias();
}

// ==========================================
// 💼 2. MÓDULO DE PROYECTOS (Actualizado PDF)
// ==========================================
let proyectoId = null;
window.limpiarFormularioProyecto = function() { 
    proyectoId = null; document.getElementById("tituloProyecto").value = ""; document.getElementById("autoresProyecto").value = ""; 
    document.getElementById("enlaceProyecto").value = ""; document.getElementById("descProyecto").value = ""; 
    document.getElementById("imgProy-txt").innerText = "Subir Captura/Portada";
    document.getElementById("pdfProy-txt").innerText = "Subir Documento (Solo PDF)";
}

async function cargarProyectos() {
    const tbody = document.getElementById("tablaProyectosBody");
    const { data } = await supabase.from("proyectos").select("*").order("created_at", { ascending: false });
    tbody.innerHTML = "";
    data?.forEach(p => {
        // Indicador visual si tiene PDF adjunto
        const tienePDF = p.documento_url ? `<span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">PDF</span>` : '';
        
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b border-gray-100">
                <td class="px-6 py-4 flex items-center">
                    <img src="${p.imagen_url || 'https://via.placeholder.com/100'}" class="h-10 w-10 rounded-lg object-cover mr-3 border border-gray-200">
                    <div><p class="font-bold text-gray-900">${p.titulo} ${tienePDF}</p></div>
                </td>
                <td class="px-6 py-4"><p class="text-sm font-semibold">${p.escuela}</p><p class="text-xs text-gray-500">${p.autores}</p></td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editarProyecto('${p.id}')" class="text-blue-500 hover:text-blue-700 p-2"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <!-- Pasamos también el documento_path para borrarlo del storage -->
                    <button onclick="eliminarProyecto('${p.id}', '${p.imagen_path}', '${p.documento_path}')" class="text-red-500 hover:text-red-700 p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`;
    }); lucide.createIcons();
}

// ==========================================
// UTILIDAD: LIMPIAR NOMBRES DE ARCHIVOS
// ==========================================
function limpiarNombreArchivo(nombre) {
    return nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
}
// ==========================================
// GUARDAR / ACTUALIZAR PROYECTO
// ==========================================
document.getElementById("btnGuardarProyecto")?.addEventListener("click", async () => {

    const titulo = document.getElementById("tituloProyecto").value.trim();
    const escuela = document.getElementById("escuelaProyecto").value;
    const autores = document.getElementById("autoresProyecto").value.trim();
    const desc = document.getElementById("descProyecto").value.trim();

    if (!titulo || !autores || !desc) {
        return showToast("Faltan datos en el proyecto", "error");
    }

    toggleLoader(true);

    try {

        let payload = {
            titulo,
            escuela,
            autores,
            descripcion: desc,
            enlace_externo: document.getElementById("enlaceProyecto").value.trim()
        };

        // ==========================================
        // 1. SUBIR IMAGEN
        // ==========================================

        const fileImg = document.getElementById("imagenProyecto")?.files[0];

        if (fileImg) {

            const nombreSeguro = limpiarNombreArchivo(fileImg.name);

            const pathImg = `proyecto_${crypto.randomUUID()}_img_${nombreSeguro}`;

            const { data: imagenSubida, error: errorImg } = await supabase.storage
                .from("archivos_unmsm")
                .upload(pathImg, fileImg, {
                    upsert: false
                });

            if (errorImg) throw errorImg;

            const { data: urlImagen } = supabase.storage
                .from("archivos_unmsm")
                .getPublicUrl(imagenSubida.path);

            payload.imagen_url = urlImagen.publicUrl;
            payload.imagen_path = imagenSubida.path;
        }


        // ==========================================
        // 2. SUBIR PDF
        // ==========================================

        const filePdf = document.getElementById("pdfProyecto")?.files[0];

        if (filePdf) {

            // Validar formato PDF
            if (
                filePdf.type !== "application/pdf" &&
                !filePdf.name.toLowerCase().endsWith(".pdf")
            ) {
                throw new Error("El archivo seleccionado no es un PDF válido.");
            }

            // Nombre seguro
            const nombreSeguro = limpiarNombreArchivo(filePdf.name);

            // Ruta única
            const pathPdf = `proyecto_${crypto.randomUUID()}_pdf_${nombreSeguro}`;

            // Subir PDF a Supabase Storage
            const { data: pdfSubido, error: errorPdf } = await supabase.storage
                .from("archivos_unmsm")
                .upload(pathPdf, filePdf, {
                    contentType: "application/pdf",
                    upsert: false
                });

            if (errorPdf) throw errorPdf;

            // Obtener URL pública
            const { data: urlPdf } = supabase.storage
                .from("archivos_unmsm")
                .getPublicUrl(pdfSubido.path);

            payload.documento_url = urlPdf.publicUrl;
            payload.documento_path = pdfSubido.path;
        }


        // ==========================================
        // 3. GUARDAR O ACTUALIZAR EN BASE DE DATOS
        // ==========================================

        if (proyectoId) {

            const { error } = await supabase
                .from("proyectos")
                .update(payload)
                .eq("id", proyectoId);

            if (error) throw error;

        } else {

            const { error } = await supabase
                .from("proyectos")
                .insert([payload]);

            if (error) throw error;
        }


        // ==========================================
        // 4. CONFIRMACIÓN
        // ==========================================

        showToast("Proyecto guardado exitosamente", "success");

        limpiarFormularioProyecto();

        document.getElementById("formProyectoCard").classList.add("hidden");

        await cargarProyectos();

    } catch (error) {

        console.error("Error al guardar proyecto:", error);

        showToast(
            "Error al guardar el proyecto: " + error.message,
            "error"
        );

    } finally {

        toggleLoader(false);

    }

});
// ==========================================
// EDITAR PROYECTO
// ==========================================
window.editarProyecto = async function(id) {

    toggleLoader(true);

    try {

        const { data, error } = await supabase
            .from("proyectos")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;

        proyectoId = id;

        document.getElementById("tituloProyecto").value = data.titulo || "";
        document.getElementById("escuelaProyecto").value = data.escuela || "";
        document.getElementById("autoresProyecto").value = data.autores || "";
        document.getElementById("enlaceProyecto").value = data.enlace_externo || "";
        document.getElementById("descProyecto").value = data.descripcion || "";

        document.getElementById("formProyectoCard").classList.remove("hidden");

        window.scrollTo(0, 0);

    } catch (error) {

        console.error("Error al cargar proyecto:", error);

        showToast("Error al cargar el proyecto: " + error.message, "error");

    } finally {

        toggleLoader(false);

    }

};
// ==========================================
// ELIMINAR PROYECTO
// ==========================================
window.eliminarProyecto = async function(id, pImg, pPdf) {

    if (!await customConfirm("¿Eliminar proyecto permanentemente?")) {
        return;
    }

    toggleLoader(true);

    try {

        // ==========================================
        // 1. ELIMINAR ARCHIVOS DEL STORAGE
        // ==========================================

        const paths = [pImg, pPdf].filter(
            p => p && p !== "null" && p !== "undefined"
        );

        if (paths.length > 0) {

            const { error: errorStorage } = await supabase.storage
                .from("archivos_unmsm")
                .remove(paths);

            if (errorStorage) throw errorStorage;
        }


        // ==========================================
        // 2. ELIMINAR REGISTRO DE LA BASE DE DATOS
        // ==========================================

        const { error } = await supabase
            .from("proyectos")
            .delete()
            .eq("id", id);

        if (error) throw error;


        // ==========================================
        // 3. ACTUALIZAR INTERFAZ
        // ==========================================

        showToast("Proyecto eliminado correctamente", "success");

        await cargarProyectos();

    } catch (error) {

        console.error("Error al eliminar proyecto:", error);

        showToast(
            "Error al eliminar el proyecto: " + error.message,
            "error"
        );

    } finally {

        toggleLoader(false);

    }

};


// ==========================================
// 👨‍🏫 3. MÓDULO DE DOCENTES
// ==========================================
let docenteId = null;
window.limpiarFormularioDocente = function() { docenteId = null; document.getElementById("nombreDocente").value = ""; document.getElementById("correoDocente").value = ""; document.getElementById("escuelasDocente").value = ""; document.getElementById("cursosDocente").value = ""; document.getElementById("imgDoc-txt").innerText = "Subir Fotografía"; }

async function cargarDocentes() {
    const tbody = document.getElementById("tablaDocentesBody");
    const { data } = await supabase.from("docentes").select("*").order("created_at", { ascending: false });
    tbody.innerHTML = "";
    data?.forEach(d => {
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b border-gray-100">
                <td class="px-6 py-4 flex items-center"><img src="${d.foto_url || 'https://via.placeholder.com/100'}" class="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200"><div><p class="font-bold text-gray-900">${d.grado_academico} ${d.nombre_completo}</p><p class="text-xs text-gray-500">${d.correo}</p></div></td>
                <td class="px-6 py-4"><p class="text-sm font-semibold">${d.escuelas}</p><p class="text-xs text-gray-500">${d.cursos}</p></td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editarDocente('${d.id}')" class="text-blue-500 hover:text-blue-700 p-2"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="eliminarDocente('${d.id}', '${d.foto_path}')" class="text-red-500 hover:text-red-700 p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`;
    }); lucide.createIcons();
}

document.getElementById("btnGuardarDocente")?.addEventListener("click", async () => {
    const nombre = document.getElementById("nombreDocente").value; const escuelas = document.getElementById("escuelasDocente").value; const cursos = document.getElementById("cursosDocente").value;
    if (!nombre || !escuelas || !cursos) return showToast("Faltan datos obligatorios", "error");
    
    toggleLoader(true);
    let payload = { nombre_completo: nombre, grado_academico: document.getElementById("gradoDocente").value, correo: document.getElementById("correoDocente").value, escuelas, cursos };
    const file = document.getElementById("fotoDocente")?.files[0];
    if (file) {
        const path = `docente_${Date.now()}_${file.name}`;
        await supabase.storage.from("archivos_unmsm").upload(path, file);
        payload.foto_url = supabase.storage.from("archivos_unmsm").getPublicUrl(path).data.publicUrl;
        payload.foto_path = path;
    }
    docenteId ? await supabase.from("docentes").update(payload).eq("id", docenteId) : await supabase.from("docentes").insert([payload]);
    toggleLoader(false); showToast("Docente guardado", "success"); limpiarFormularioDocente(); document.getElementById('formDocenteCard').classList.add('hidden'); cargarDocentes();
});

window.editarDocente = async function(id) {
    toggleLoader(true); const { data } = await supabase.from("docentes").select("*").eq("id", id).single(); toggleLoader(false);
    docenteId = id; document.getElementById("nombreDocente").value = data.nombre_completo; document.getElementById("gradoDocente").value = data.grado_academico; document.getElementById("correoDocente").value = data.correo; document.getElementById("escuelasDocente").value = data.escuelas; document.getElementById("cursosDocente").value = data.cursos;
    document.getElementById("formDocenteCard").classList.remove("hidden"); window.scrollTo(0,0);
}
window.eliminarDocente = async function(id, path) {
    if (!await customConfirm("¿Eliminar docente?")) return;
    toggleLoader(true); if(path && path !== 'null') await supabase.storage.from("archivos_unmsm").remove([path]);
    await supabase.from("docentes").delete().eq("id", id); toggleLoader(false); showToast("Eliminado", "success"); cargarDocentes();
}

// ==========================================
// ⚙️ 4. MÓDULO DE CONFIGURACIÓN (Actualizado UX)
// ==========================================

// Función para bloquear/desbloquear los inputs
function toggleFormConfig(disabledState) {
    const inputs = ["confTelefono", "confCorreo", "confFb", "confIg", "confMision", "confVision", "confBanner"];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabledState;
    });
    
    // Visibilidad de botones
    document.getElementById("btnGuardarConfig").classList.toggle("hidden", disabledState);
    document.getElementById("btnCancelarConfig").classList.toggle("hidden", disabledState);
    
    document.getElementById("btnEditarConfig").classList.toggle("hidden", !disabledState);
    document.getElementById("btnEliminarConfig").classList.toggle("hidden", !disabledState);
}

async function cargarConfiguracion() {
    const { data } = await supabase.from("configuracion").select("*").limit(1).single();
    if (data) {
        document.getElementById("configId").value = data.id;
        document.getElementById("confTelefono").value = data.telefono || '';
        document.getElementById("confCorreo").value = data.correo || '';
        document.getElementById("confFb").value = data.facebook_url || '';
        document.getElementById("confIg").value = data.instagram_url || '';
        document.getElementById("confMision").value = data.mision || '';
        document.getElementById("confVision").value = data.vision || '';
        
        if (data.banner_url) {
            document.getElementById("imgConf-txt").innerText = "Banner Actualizado";
            document.getElementById("bannerContainer").style.backgroundImage = `url('${data.banner_url}')`;
            document.getElementById("bannerContainer").style.backgroundSize = "cover";
            document.getElementById("bannerContainer").style.backgroundPosition = "center";
        }
        // Bloquear form porque ya hay datos
        toggleFormConfig(true);
    } else {
        // Formulario libre para crear la primera vez
        toggleFormConfig(false);
        document.getElementById("btnCancelarConfig").classList.add("hidden"); // Ocultar cancelar si es nuevo
    }
}

// Botones de Configuración
document.getElementById("btnEditarConfig")?.addEventListener("click", () => {
    toggleFormConfig(false);
});

document.getElementById("btnCancelarConfig")?.addEventListener("click", () => {
    cargarConfiguracion(); // Recargar datos originales y bloquear
});

document.getElementById("btnEliminarConfig")?.addEventListener("click", async () => {
    if (!await customConfirm("⚠️ ESTO ELIMINARÁ LA CONFIGURACIÓN DE LA PÁGINA PÚBLICA.\n¿Estás completamente seguro?")) return;
    
    toggleLoader(true);
    const id = document.getElementById("configId").value;
    
    // Opcional: Podrías traer el banner_path antes y borrarlo del storage aquí
    await supabase.from("configuracion").delete().eq("id", id);
    
    // Limpiar campos visuales
    document.getElementById("configId").value = "";
    document.getElementById("confTelefono").value = "";
    document.getElementById("confCorreo").value = "";
    document.getElementById("confFb").value = "";
    document.getElementById("confIg").value = "";
    document.getElementById("confMision").value = "";
    document.getElementById("confVision").value = "";
    document.getElementById("bannerContainer").style.backgroundImage = "none";
    document.getElementById("imgConf-txt").innerText = "Actualizar Foto de Portada";

    toggleFormConfig(false);
    document.getElementById("btnCancelarConfig").classList.add("hidden"); 
    toggleLoader(false);
    
    showToast("Datos de configuración eliminados", "success");
});

document.getElementById("btnGuardarConfig")?.addEventListener("click", async () => {
    toggleLoader(true);
    let payload = {
        telefono: document.getElementById("confTelefono").value, correo: document.getElementById("confCorreo").value,
        facebook_url: document.getElementById("confFb").value, instagram_url: document.getElementById("confIg").value,
        mision: document.getElementById("confMision").value, vision: document.getElementById("confVision").value
    };
    const file = document.getElementById("confBanner")?.files[0];
    if (file) {
        const path = `banner_${Date.now()}_${file.name}`;
        await supabase.storage.from("archivos_unmsm").upload(path, file);
        payload.banner_url = supabase.storage.from("archivos_unmsm").getPublicUrl(path).data.publicUrl;
        payload.banner_path = path;
    }
    
    const id = document.getElementById("configId").value;
    id ? await supabase.from("configuracion").update(payload).eq("id", id) : await supabase.from("configuracion").insert([payload]);
    
    toggleLoader(false); 
    showToast("Configuración Guardada", "success"); 
    cargarConfiguracion(); // Recargar bloqueará el form automáticamente
});