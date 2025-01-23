//#region Carga Inicial

$(function () {
   // ControlAsistenciaSelectData();
     solicitarPermisos(); // Solicitar permisos de cámara y ubicación al cargar la página
    CompararRostro();
});

//#endregion

//#region SeleccionarDatos

const ControlAsistenciaSelectData = async () => {
    try {
        const response = await fetch($("#urlSeleccionarDatos").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                IdUsuario: 36
            })
        });
        // Si la response es buena
        if (response.ok) {
            // Obtener Json de response
            let jsonObject = await response.json();
            console.log(jsonObject.contenido);
            // Si la response es mala
        } else {
            // Mensaje de error del servidor
            const errorMessage = await response.text();
            // Error
            throw new Error("Error en la solicitud");
        }
    } catch (error) {
        console.error("Error: ", error);
    }
};

//#endregion

//#region Camara y Ubicación

const videoElement = document.getElementById('video');
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// Función para solicitar permisos de cámara
async function activarCamara() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;

            video.addEventListener("loadeddata", () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                detectFaces();
            });
        } catch (error) {
            console.error("Error al acceder a la cámara:", error);
            alert("No se pudo acceder a la cámara. Verifica los permisos.");
        }
    } else {
        alert("Tu navegador no soporta el acceso a la cámara.");
    }
}
async function detectFaces() {
    const model = await blazeface.load();

    async function detect() {
        const predictions = await model.estimateFaces(video, false);

        // Limpiar el canvas antes de dibujar
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (predictions.length > 0) {
            predictions.forEach((prediction) => {
                const start = prediction.topLeft;
                const end = prediction.bottomRight;

                // Escalar las coordenadas al tamaño del video/canvas
                const x = start[0];
                const y = start[1]-40;
                const width = end[0] - start[0];
                const height = end[1] - start[1];

                // Dibujar un rectángulo alrededor del rostro
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "red";
               ctx.rect(x, y, width, height);
                ctx.stroke();
            });
        }

        // Repetir detección en el siguiente frame
        requestAnimationFrame(detect);
    }

    detect();
}
// Iniciar la cámara y el modelo

// Función para solicitar permisos de ubicación
function activarUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("Ubicación obtenida:", position);
                // Aquí puedes usar la posición obtenida (latitude, longitude) para cualquier propósito
            },
            (error) => {
                console.error("Error al obtener la ubicación:", error);
                alert("No se pudo obtener la ubicación. Por favor, verifica los permisos.");
            }
        );
    } else {
        alert("Tu navegador no soporta la geolocalización.");
    }
}

// Función para solicitar permisos de cámara y ubicación al cargar la página
function solicitarPermisos() {
    // Solicitar permisos de ubicación
    activarUbicacion();
    // Solicitar permisos de cámara
    activarCamara();
}

//#endregion

//#endregion

//#region ComparacionRostros
const CompararRostro = async () => {
    try {     
        const response = await fetch($("#urlCompararFotos").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                IdUsuario: 24
            })
        });
       
        // Si la response es buena
        if (response.ok) {
            let jsonObject = await response.json();

           
            if (jsonObject.contenido == false) {              
                alert("No se pudo registrar.");
            } else {
                console.log(jsonObject.contenido);
            }
        } else {
            const errorMessage = await response.text();
            throw new Error("Error en la solicitud");
        }
    } catch (error) {
        console.error("Error: ", error);
        // En caso de error, mostramos el progreso completo para indicar que terminó la ejecución.
    }
};


 //#endregion compracionrostros