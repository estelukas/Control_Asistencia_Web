//#region Carga Inicial
let jsonResponse = [];
let EstaEnGeocerca=0;
let IdCentroServicio = 0;
let htmlContent;
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
                // Evitar recargar en un ciclo
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


const solicitarPermisoCamara = async () => {
    cargarContenedorCamara();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            // Solicitar acceso a la cámara
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // Detener el stream inmediatamente para evitar inicializar la cámara
            stream.getTracks().forEach((track) => track.stop());

            // Ocultar el div de permisos de cámara
            $('#divContenedorCamara').hide();
            $('#divContenedorGps').hide();

            // Cargar control de asistencia
            await cargarControlAsistencia(true);

            // Inicializar la cámara una vez que el contenido parcial está cargado
            inicializarCamara();
        } catch (error) {
            console.error("Error al acceder a la cámara:", error);

            // Mostrar el div de permisos de cámara si los permisos fueron denegados
            $('#divContenedorCamara').show();
        }
    } else {
        alert("Tu navegador no soporta el acceso a la cámara.");
        $('#divContenedorCamara').show();
    }
};

// Función para inicializar la cámara
const inicializarCamara = async () => {
    try {
        // Obtener los elementos del DOM
        const videoElement = document.getElementById('video');
        const canvas = document.getElementById("canvas");

        // Verifica que los elementos existan en el DOM
        if (!videoElement || !canvas) {
            console.error("No se encontraron los elementos de video o canvas en el DOM.");
            return;
        }

        // Solicitar acceso a la cámara nuevamente
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;

        videoElement.addEventListener("loadeddata", () => {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            detectFaces();
        });

        // Detectar si es necesario aplicar un flip horizontal
        const settings = stream.getVideoTracks()[0].getSettings();
        if (settings.facingMode === "user") {
            videoElement.style.transform = "scaleX(-1)";
        } else {
            videoElement.style.transform = "none";
        }

        // Evento para capturar imagen al hacer clic en el botón
        const botonCaptura = document.getElementById("Registrar");
        botonCaptura.addEventListener("click", capturarImagen);

        // Inicializar el selector con las opciones configuradas en los atributos data-*
        const selectElement = document.getElementById('Select_SearchEmpleado');
        mdb.Select.getInstance(selectElement) || new mdb.Select(selectElement);

        seleccionarEntradaSalidaPorDefecto();
    } catch (error) {
        console.error("Error al inicializar la cámara:", error);
    }
};

//#endregion Funciones de Permisos

//#region ValidarGeocerca

const ConsultarGeocerca = async (latitud, longuitud) => {
    try {
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

//#region Recargar Permisos

// Función para recargar los permisos de GPS cuando el usuario hace clic en "Recargar Permisos"
$('#recargarButtonGps').on('click', () => {
    location.reload();
});

$('#recargarButtonCamara').on('click', () => {
    location.reload();
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

//#region Cargar Control Asistencia

// Cargar dinámicamente el Partial View
const cargarControlAsistencia = async (estaEnGeocerca) => {
    try {
        const url = $("#urlCargarControlAsistencia").data("action-url");

        const response = await fetch(`${url}?estaEnGeocerca=${estaEnGeocerca}`, {
            method: "GET",
        });

        if (response.ok) {
            const htmlContent = await response.text();
            // Renderiza el contenido parcial pero no lo muestra aún
            $("#controlAsistenciaContainer").html(htmlContent);
            $('#controlAsistenciaContainer').show();
        } else {
            throw new Error(`Error al cargar el control de asistencia: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error al cargar el control de asistencia:", error);
    }
};

//#endregion Cargar Control Asistencia

//#region Cargar Contenedor Camara

const cargarContenedorCamara = async () => {
    try {
        const response = await fetch($("#urlCargarContenedorCamara").data("action-url"), {
            method: "GET",
            headers: {
                "Content-Type": "text/html",
            },
        });

        if (response.ok) {
            const htmlContent = await response.text();
            // Cargar el contenido dinámico en el contenedor
            $("#divContenedorCamaraContainer").html(htmlContent);

            // Asegúrate de que se muestre
            $("#divContenedorCamaraContainer").show().css({
                display: "block",
                visibility: "visible",
                opacity: "1",
            });

            // Asociar eventos después de cargar
            document.getElementById("recargarButtonCamara").addEventListener("click", solicitarPermisoCamara);
        } else {
            console.error("Error al cargar el partial view del contenedor de cámara:", response.statusText);
        }
    } catch (error) {
        console.error("Error al cargar el contenedor de cámara:", error);
    }
};


//#endregion Cargar Contenedor Camara

//#region ConsultarDatos

const EmpleadoConsultarDatosSelectData = async (searchTerm = "") => {
    try {
        // Si searchTerm está vacío, limpiamos las opciones del select
        if (!searchTerm.trim()) {
            $('#Select_SearchEmpleado').empty(); // Limpia todas las opciones del select
            $('#Select_SearchEmpleado').prop('disabled', false); // Habilita el select
            $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide(); // Oculta "Sin resultados"
            return;
        }

        const response = await fetch($("#urlSeleccionarDatos").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
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
                    return [valor, empleado.Nombre_Empleado, mainText, secondaryText];
                });

                // Llamar a la función para llenar el select
                fillMDBSelect('#Select_SearchEmpleado', optionsArray);

                // Asegurarse de que el select esté habilitado
                $('#Select_SearchEmpleado').prop('disabled', false);
                $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide(); // Ocultar "Sin resultados" si hay datos
            } else {
                console.error("Error en los datos del servidor");
                $('#Select_SearchEmpleado').empty(); // Limpia el select si no hay datos
                $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').show(); // Mostrar "Sin resultados"
                $('#Select_SearchEmpleado').prop('disabled', false); // Asegurarse de que el select esté habilitado
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

    // Si hay texto, ocultar el mensaje de "Sin resultados"
    if (searchTerm.length > 0) {
        $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide();
    }

    // Si el texto tiene al menos 4 caracteres, realiza la búsqueda
    if (searchTerm.length >= 4) {
        EmpleadoConsultarDatosSelectData(searchTerm); // Llama a la función de búsqueda
    } else if (searchTerm.length === 0) {
        // Si no hay texto, limpiar el select, eliminar "Sin datos" y ocultar "Sin resultados"
        $('#Select_SearchEmpleado').empty(); // Limpiar el select completamente
        $('#Select_SearchEmpleado').prop('disabled', false); // Asegurarse de que el select esté habilitado
        $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide(); // Ocultar "Sin resultados"
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
    const fecha = new Date();

    // Obtén el año
    const year = fecha.getFullYear();

    // Obtén el mes (agregar un 0 si es menor a 10)
    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    // Obtén la hora con segundos (agregar un 0 si es menor a 10)
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    const seconds = String(fecha.getSeconds()).padStart(2, '0');
    const nombre = `${hours}${minutes}${seconds}.png`;
    // Combina todo en el formato deseado
    const resultado = `/${year}/${month}/`;
    // Si hay un flip horizontal, aplicarlo al canvas
    
        context.save();
        context.scale(-1, 1); // Voltear el canvas horizontalmente
        context.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();
    
    // Convertir el contenido del canvas a un archivo PNG
    const imageData = canvas.toDataURL("image/png");

    let rfc = $('#Select_SearchEmpleado').val();

    const ruta = rfc + resultado;
    //rfc = rfc + '.png';
    
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
                Nombre: nombre, // Puedes incluir el nombre del archivo
                Ruta: ruta,
                Rfc: rfc
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

//#region detectar rostros
async function detectFaces() {
    const model = await blazeface.load();
    const ctx = canvas.getContext("2d");
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

//#region Seleccionar Entrada Salida Por Defecto

const seleccionarEntradaSalidaPorDefecto = () => {
    const horaActual = new Date().getHours(); // Obtiene la hora actual

    // Si es antes del mediodía, selecciona "Entrada"
    if (horaActual < 12) {
        document.getElementById('entradaOption').checked = true;
        document.getElementById('salidaOption').checked = false;
    } else {
        // Si es después del mediodía, selecciona "Salida"
        document.getElementById('entradaOption').checked = false;
        document.getElementById('salidaOption').checked = true;
    }
};


//#endregion Seleccionar Entrada Salida Por Defecto 
