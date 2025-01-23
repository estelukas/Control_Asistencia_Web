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

// Función para solicitar permisos de cámara y ubicación al cargar la página
function solicitarPermisos() {
    // Solicitar permisos de cámara
    activarCamara();

    // Solicitar permisos de ubicación
    activarUbicacion();
}

// Desactivar el comportamiento de sincronización automática del input visible con el campo de búsqueda
$(document).on('click', '.select-option', function (e) {
    e.stopPropagation(); // Prevenir que el clic actualice automáticamente el input visible
});


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
