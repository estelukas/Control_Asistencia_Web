﻿//#region Carga Inicial
let jsonResponse = [];
let EstaEnGeocerca=0;
let IdCentroServicio=0;
$(document).ready(() => {
    $('#divContenedorCamara').hide();
    $('#divControlAsistencia').hide();

    // Inicia el flujo solicitando permisos de ubicación
    solicitarPermisoUbicacion();
});

//#endregion

//#region Funciones de Permisos

// Solicitar permisos de ubicación
const solicitarPermisoUbicacion = async () => {
    if (navigator.geolocation) {
        try {
            // Convertimos getCurrentPosition en una Promesa
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            // Llamamos a ConsultarGeocerca con await
            await ConsultarGeocerca(position.coords.latitude, position.coords.longitude);

            if (EstaEnGeocerca == 1) {
                $('#divContenedorGps').hide();
                $('#divContenedorCamara').show();
                solicitarPermisoCamara();
            } else {
                $('#divContenedorGps').show();
                $('#divContenedorCamara').hide();
                alert('No estás en una geocerca válida');
            }
        } catch (error) {
            console.error("Error al obtener la ubicación:", error);
            // Mostrar el div de GPS si ocurre un error o se deniega el permiso
            if (error.code === error.PERMISSION_DENIED) {
                $('#divContenedorGps').show();
            } else {
                alert("Error al intentar obtener la ubicación.");
                $('#divContenedorGps').show();
            }
        }
    } else {
        alert("Tu navegador no soporta la geolocalización.");
        $('#divContenedorGps').show();
    }
};


// Solicitar permisos de cámara
const solicitarPermisoCamara = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia({ video: true }) // Solicitar acceso a la cámara
            .then((stream) => {
                // Asignar el flujo de video al elemento <video>
                const videoElement = document.getElementById('video');
                const canvas = document.getElementById("canvas");
                videoElement.srcObject = stream;
                video.addEventListener("loadeddata", () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    detectFaces();
                });
                // Detectar si es necesario aplicar un flip horizontal
                const settings = stream.getVideoTracks()[0].getSettings();
                if (settings.facingMode === "user") {
                    // Flip horizontal para cámaras frontales
                    videoElement.style.transform = "scaleX(-1)";
                } else {
                    // No aplicar transformaciones a cámaras traseras
                    videoElement.style.transform = "none";
                }
                const botonCaptura = document.getElementById("Registrar");
                botonCaptura.addEventListener("click", capturarImagen);


                // Ocultar el div de permisos de cámara y mostrar el de control de asistencia
                $('#divContenedorCamara').hide();
                $('#divControlAsistencia').show();
            })
            .catch((error) => {
                // Mostrar el div de cámara si los permisos fueron denegados
                $('#divContenedorCamara').show();
            });
    } else {
        alert("Tu navegador no soporta el acceso a la cámara.");
        $('#divContenedorCamara').show();
    }
}

//#endregion

//#region detectar rostros
const ctx = canvas.getContext("2d");
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
                const y = start[1] - 40;
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
//#endregion detectar rostros

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
                IdUsuario: 24, // Cambia esto por el Id del usuario
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
                    valor = empleado.RFC;
                    return [valor,empleado.Nombre_Empleado, mainText, secondaryText];
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
//#endregion

//#region Eventos del Select_SearchEmpleado

// Event listener para el cambio en el input de búsqueda
$(document).on('input', '.form-control.select-filter-input', function () {
    const searchTerm = $(this).val().trim(); // Captura el texto del buscador

    // Verifica si el texto tiene al menos 4 caracteres
    if (searchTerm.length >= 4) {
        EmpleadoConsultarDatosSelectData(searchTerm); // Llama a la función de búsqueda
    }
});

// Manejar la selección de un empleado en el dropdown
$('#Select_SearchEmpleado').on('change', function () {
    const selectedValue = $(this).val(); // Obtén el valor seleccionado
    const selectedText = $(this).find(':selected').text(); // Obtén el texto seleccionado
});

// Desactivar el comportamiento de sincronización automática del input visible con el campo de búsqueda
$(document).on('click', '.select-option', function (e) {
    e.stopPropagation(); // Prevenir que el clic actualice automáticamente el input visible
});


//#endregion

//#region fillMDBSelect

// Función para llenar el select con MDBootstrap
function fillMDBSelect(id, optionsArray) {
    var selectElement = $(id); // Seleccionar el elemento
    const selectInstance = mdb.Select.getInstance(selectElement[0]); // Obtener instancia actual

    selectElement.empty(); // Vaciar el contenido del select

    if (optionsArray.length === 0) {
        // Si no hay datos, agregar opción predeterminada
        let defaultOption = $("<option>", {
            value: 0,
            text: "Sin datos",
            hidden: true,
            class: "hidden selected text-secondary"
        });
        selectElement.append(defaultOption);
        selectElement.prop("disabled", true);
    } else {
        // Agregar la opción predeterminada
        let defaultOption = $("<option>", {
            value: "",
            text: "Seleccionar",
            hidden: true,
            class: "hidden selected text-secondary"
        });
        selectElement.append(defaultOption);

        // Agregar las opciones dinámicamente
        optionsArray.forEach(([value, mainText, secondaryText]) => {
       
            const option = $("<option>", {
                value: value,
                text: secondaryText,
                'data-mdb-secondary-text': 'Centro de Servicio ' + mainText.split('Centro de Servicio')[1]
        });
                
            selectElement.append(option);
    });

        selectElement.prop("disabled", false);
    }
}


//#endregion fillMDBSelect

//#region tomar foto y guardar en ftp
const capturarImagen = async () => {
    const context = canvas.getContext("2d");
    const videoElement = document.getElementById('video');
    // Si hay un flip horizontal, aplicarlo al canvas
    
        context.save();
        context.scale(-1, 1); // Voltear el canvas horizontalmente
        context.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();
    
    // Convertir el contenido del canvas a un archivo PNG
    const imageData = canvas.toDataURL("image/png");

    let rfc = $('#Select_SearchEmpleado').val();
    
    const ruta = 'Empleados/' + rfc + '/Fotos/';
    rfc = rfc + '.png';
    
    if (rfc == 'null.png') {
        alert('debes ecribir tu clave de empleado')
        return false;
    }
   
    // Enviar la imagen al servidor
    try {
        const response = await fetch($("#urlGuardarFoto").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                Base64: imageData, // Enviamos la imagen en base64
                Nombre: rfc, // Puedes incluir el nombre del archivo
                Ruta: ruta
            })
        });
        if (response.ok) {
            const result = await response.json();
            console.log(result.contenido);
            alert(result.contenido); // Ruta devuelta por el servidor
        } else {
            throw new Error('Error al guardar la imagen.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo guardar la imagen.');
    }
};
//#endregion tomar foto y guardar en ftp//#endregion tomar foto y guardar en ftp

//#region ValidarGeocerca

const ConsultarGeocerca = async (latitud,longuitud) => {
    try {
        //latitud = '25.803844';
        //longuitud = '-100.275934';
        console.log(latitud, longuitud);
        const response = await fetch($("#urlValidarGeocerca").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                Longuitud: longuitud.toString(), // Cambia esto por el Id del usuario
                Latitud: latitud.toString() // Pasar el término de búsqueda
            })
        });

        if (response.ok) {
            // Obtener el JSON de la respuesta
            let jsonObject = await response.json();
            if (jsonObject.id == 1) {               
                let json = JSON.parse(jsonObject.contenido);
                jsonResponse = json.ValidarCobertura;
                if (jsonResponse.length > 0) {
                    EstaEnGeocerca = 1;
                    IdCentroServicio = jsonResponse[0].id;
                } else {
                    EstaEnGeocerca = 0;
                    IdCentroServicio = null;
                }                
            } 
        } else {
            const errorMessage = await response.text();
            throw new Error("Error en la solicitud: " + errorMessage);
        }
    } catch (error) {
        console.error("Error: ", error);
    }
};
//#endregion
