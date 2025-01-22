//#region Carga Inicial

$(document).ready(function () {
    ControlAsistenciaSelectData();
    solicitarPermisos(); // Solicitar permisos de cámara y ubicación al cargar la página
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
            console.log(jsonObject);
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

// Función para solicitar permisos de cámara
function activarCamara() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia({ video: true }) // Solicitar acceso a la cámara
            .then((stream) => {
                // Asignar el flujo de video al elemento <video>
                videoElement.srcObject = stream;
            })
            .catch((error) => {
                console.error("Error al acceder a la cámara:", error);
                alert("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
            });
    } else {
        alert("Tu navegador no soporta el acceso a la cámara.");
    }
}

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
    // Solicitar permisos de cámara
    activarCamara();

    // Solicitar permisos de ubicación
    activarUbicacion();
}

//#endregion

//#region Recargar Permisos

// Función para recargar los permisos de la cámara
function recargarPermisos() {
    // Detener todos los flujos de video anteriores
    const stream = videoElement.srcObject;
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
    }

    // Volver a activar la cámara
    activarCamara();
}

//#endregion
