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
                ParametroBusqueda: searchTerm // Pasar el término de búsqueda
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
                fillMDBSelect('#Select_SearchEmpleado', optionsArray);
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
$(document).on('input', '.form-control.select-filter-input', function () {
    const searchTerm = $(this).val().trim(); // Captura el texto que se escribe en el buscador

    // Llama a la función de búsqueda dinámica
    EmpleadoConsultarDatosSelectData(searchTerm);
});

// Manejar la selección de un empleado en el dropdown
$('#Select_SearchEmpleado').on('change', function () {
    const selectedValue = $(this).val(); // Obtén el valor seleccionado
    const selectedText = $(this).find(':selected').text(); // Obtén el texto seleccionado
    console.log('Empleado seleccionado:', selectedValue, selectedText);

    // Aquí puedes manejar el evento cuando se selecciona un empleado
});

// Desactivar el comportamiento de sincronización automática del input visible con el campo de búsqueda
$(document).on('click', '.select-option', function (e) {
    e.stopPropagation(); // Prevenir que el clic actualice automáticamente el input visible
});


//#endregion

//#region fillMDBSelect

// Función para llenar el select con MDBootstrap
function fillMDBSelect(id, optionsArray) {
    const selectElement = $(id);
    selectElement.empty(); // Limpia las opciones actuales

    // Agrega la opción por defecto
    selectElement.append(
        $('<option>', {
            value: "",
            text: "Seleccionar",
            class: "hidden text-secondary",
            hidden: true,
        })
    );

    // Agrega las opciones dinámicas
    optionsArray.forEach(([value, mainText, secondaryText]) => {
        const optionElement = $('<option>', {
            value: value,
            text: mainText,
            'data-mdb-secondary-text': secondaryText, // Usa atributo específico de MDB para texto secundario
        });
        selectElement.append(optionElement);
    });

    // Actualiza el select de MDBootstrap para aplicar los cambios
    selectElement.mdbSelect('destroy'); // Destruye el select actual
    selectElement.mdbSelect(); // Inicializa el select nuevamente
}//#endregion fillMDBSelect
