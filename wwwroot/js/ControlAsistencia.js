//#region Carga Inicial

$(document).ready(() => {
    $('#divContenedorCamara').hide();
    $('#divControlAsistencia').hide();

    // Inicia el flujo solicitando permisos de ubicación
    solicitarPermisoUbicacion();
});

//#endregion

//#region Funciones de Permisos

// Solicitar permisos de ubicación
const solicitarPermisoUbicacion = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("Ubicación obtenida:", position);

                // Ocultar el div de permiso de GPS y proceder a solicitar permisos de cámara
                $('#divContenedorGps').hide();
                solicitarPermisoCamara();
                $('#divContenedorCamara').show();
            },
            (error) => {
                console.error("Error al obtener la ubicación:", error);

                // Mostrar el div de GPS si los permisos no son otorgados o están en espera
                if (error.code === error.PERMISSION_DENIED) {
                    $('#divContenedorGps').show();
                }
            }
        );
    } else {
        alert("Tu navegador no soporta la geolocalización.");
        $('#divContenedorGps').show();
    }
}

// Solicitar permisos de cámara
const solicitarPermisoCamara = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia({ video: true }) // Solicitar acceso a la cámara
            .then((stream) => {
                console.log("Acceso a la cámara otorgado.");

                // Asignar el flujo de video al elemento <video>
                const videoElement = document.getElementById('video');
                videoElement.srcObject = stream;

                // Detectar si es necesario aplicar un flip horizontal
                const settings = stream.getVideoTracks()[0].getSettings();
                if (settings.facingMode === "user") {
                    // Flip horizontal para cámaras frontales
                    videoElement.style.transform = "scaleX(-1)";
                } else {
                    // No aplicar transformaciones a cámaras traseras
                    videoElement.style.transform = "none";
                }

                // Ocultar el div de permisos de cámara y mostrar el de control de asistencia
                $('#divContenedorCamara').hide();
                $('#divControlAsistencia').show();
            })
            .catch((error) => {
                console.error("Error al acceder a la cámara:", error);

                // Mostrar el div de cámara si los permisos fueron denegados
                $('#divContenedorCamara').show();
            });
    } else {
        alert("Tu navegador no soporta el acceso a la cámara.");
        $('#divContenedorCamara').show();
    }
}

//#endregion

//#region Recargar Permisos

// Función para recargar los permisos de GPS cuando el usuario hace clic en "Recargar Permisos"
$('#recargarButtonGps').on('click', () => {
    // Recargar la página para restablecer el estado de los permisos
    location.reload(); // Recarga la página y reinicia todo el flujo de permisos
});

$('#recargarButtonCamara').on('click', () => {
    // Recargar la página para restablecer el estado de los permisos
    location.reload(); // Recarga la página y reinicia todo el flujo de permisos
});

//#endregion

//#region Verificación de permisos dinámicos

// Verifica los permisos de ubicación y cámara y ajusta la interfaz dinámicamente
const verificarPermisos = () => {
    // Verificar permisos de ubicación
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state !== "granted") {
            // Si los permisos de ubicación no están otorgados, mostrar el div de permiso de GPS
            $('#divControlAsistencia').hide();
            $('#divRestablecerPermisos').hide();
            $('#divContenedorGps').show();
        } else {
            // Si GPS está otorgado, verificar permisos de cámara
            navigator.permissions.query({ name: "camera" }).then((result) => {
                if (result.state !== "granted") {
                    // Si los permisos de cámara no están otorgados, mostrar el div de restablecer permisos
                    $('#divControlAsistencia').hide();
                    $('#divRestablecerPermisos').show();
                }
            });
        }
    });
}

// Llamar a verificar permisos periódicamente
setInterval(verificarPermisos, 3000); // Verificar cada 3 segundos

//#endregion

//#region ConsultarDatos

const EmpleadoConsultarDatosSelectData = async (searchTerm = "") => {
    try {
        const response = await fetch($("#urlSeleccionarDatos").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                IdUsuario: 36, // Cambia esto por el Id del usuario
                ParametroBusqueda: searchTerm  // Pasar el término de búsqueda
            })
        });

        if (response.ok) {
            // Obtener el JSON de la respuesta
            let jsonObject = await response.json();

            // Verifica si el JSON tiene datos de empleados
            if (jsonObject.id === 1 && jsonObject.contenido) {
                // Parsear el contenido que es una cadena JSON
                const empleados = JSON.parse(jsonObject.contenido).EmpleadoConsulta;

                // Crear un array para las opciones del select con la lógica solicitada
                const optionsArray = empleados.map(empleado => {
                    // Separar el texto principal y el texto secundario
                    let [mainText, secondaryText] = empleado.Nombre_Empleado.split('Centro de Servicio:');
                    mainText = mainText.trim(); // Nombre del empleado
                    secondaryText = secondaryText ? 'Centro de Servicio: ' + secondaryText.trim() : ''; // Centro de Servicio

                    return [empleado.Nombre_Empleado, mainText, secondaryText];
                });

                // Llamar a la función para llenar el select
                fillSelectDefaultHidden('#empleadoSelect', optionsArray);
            } else {
                console.error("Error en los datos del servidor");
            }
        } else {
            const errorMessage = await response.text();
            throw new Error("Error en la solicitud: " + errorMessage);
        }
    } catch (error) {
        console.error("Error: ", error);
    }
};

// Event listener para el cambio en el input de búsqueda
$('#searchEmpleado').on('input', function () {
    // Llamar a la función para obtener los empleados que coincidan con la búsqueda
    const searchTerm = $(this).val().trim(); // Obtener valor escrito por el usuario
    EmpleadoConsultarDatosSelectData(searchTerm);
});

//#endregion

function fillSelectDefaultHidden(id, optionsArray) {
    let selectElement = $(id);
    selectElement.empty();

    if (optionsArray.length === 0) {
        let defaultOption = document.createElement("option");
        defaultOption.value = 0;
        defaultOption.text = "Sin datos";
        defaultOption.classList.add("hidden", "selected", "text-secondary");
        defaultOption.hidden = true;
        selectElement.append(defaultOption);
        selectElement.prop('disabled', true);
    } else {
        let defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.text = "Seleccionar";
        defaultOption.classList.add("hidden", "selected", "text-secondary");
        defaultOption.hidden = true;
        selectElement.append(defaultOption);

        for (const element of optionsArray) {
            let option = $("<option>")
                .val(element[0])
                .text(element[1]);
            if (element[2]) option.attr('data-mdb-secondary-text', element[2]);
            selectElement.append(option);
        }
        selectElement.prop('disabled', false);
    }
}