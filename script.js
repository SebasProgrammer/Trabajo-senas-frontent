const video = document.getElementById('videocont');
const canvas = document.getElementById('canvas');
const output = document.getElementById('output');
const context = canvas.getContext('2d');

// Mapeo de palabras clave a URLs de videos
const videos = {
    "hola": "hola.mp4",  // Cambié las palabras clave a minúsculas
    "gracias": "gracias.mp4"
};

// Obtener elementos HTML
const keywordInput = document.getElementById("keywordInput");
const videoElement = document.getElementById("video");
const videoSource = document.getElementById("videoSource");

// Función asincrónica para iniciar la cámara
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (error) {
        console.error("Error al acceder a la cámara: ", error);
    }
}

let frameCounter = 0;

async function captureFrame() {
    frameCounter++;

    // Solo procesar cada 5 frames
    if (frameCounter % 12 !== 0) {
        return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg");

    try {
        const response = await fetch('http://127.0.0.1:5007/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Image })
        });
        const data = await response.json();

        output.innerHTML = "";  // Limpiar resultados anteriores

        // Mostrar animación de carga
        const loadingDiv = document.createElement("div");
        loadingDiv.classList.add("loading");
        loadingDiv.innerText = "Cargando...";
        output.appendChild(loadingDiv);

        const detectedWords = new Set();

        if (data.detections && data.detections.length > 0) {
            loadingDiv.remove();

            data.detections.forEach(deteccion => {
                if (!detectedWords.has(deteccion)) {
                    detectedWords.add(deteccion);
                    const p = document.createElement("p");
                    p.innerHTML = `Gesto detectado: <span>${deteccion}</span>`;
                    output.appendChild(p);
                }
            });
        } else {
            loadingDiv.remove();
            const p = document.createElement("p");
            p.innerText = "No se detectaron gestos.";
            p.classList.add("no-detection");
            output.appendChild(p);
        }
    } catch (error) {
        console.error("Error al enviar la imagen: ", error);
    }
}



// Iniciar la cámara al cargar la página
startCamera();

// Configurar la captura de frames cada 200ms
setInterval(captureFrame, 1000);

// Función asincrónica para actualizar el video
async function playVideo(keyword) {
    try {
        // Buscar si la palabra clave tiene un video asociado
        if (videos[keyword]) {
            videoSource.src = videos[keyword];
            await videoElement.load();
            videoElement.style.display = "block";
            await videoElement.play();
            videoElement.loop = true;  // Reproduce en loop
            videoElement.muted = true; // Mute el video
        } else {
            // Ocultar el video si la palabra clave no coincide
            videoElement.style.display = "none";
            videoElement.loop = false; // Deshabilitar loop cuando no coincide
            videoElement.muted = false; // Desactivar mute cuando no hay video
        }
    } catch (error) {
        console.error("Error al reproducir el video: ", error);
    }
}

// Escuchar los cambios en el área de texto
keywordInput.addEventListener("input", () => {
    const inputText = keywordInput.value.trim().toLowerCase(); // Convertir a minúsculas
    playVideo(inputText);
});

// Escuchar cuando el usuario presiona una tecla
keywordInput.addEventListener("keydown", (event) => {
    // Verificar si la tecla presionada es "Backspace" (código 8)
    if (event.key === "Backspace") {
        keywordInput.value = ""; // Borrar toda la palabra
        playVideo(""); // Detener el video
    }
});

// Obtener el botón Home
const homeButton = document.getElementById("homeButton");

// Función para hacer scroll hacia arriba al hacer clic en Home
homeButton.addEventListener("click", (event) => {
    event.preventDefault();  // Evitar el comportamiento predeterminado del enlace
    window.scrollTo({
        top: 0,               // Desplazar hacia el inicio de la página
        behavior: "smooth"     // Desplazamiento suave
    });
});
