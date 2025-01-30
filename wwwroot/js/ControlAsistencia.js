//#region Variables Mobiles
let android = window.Android;

const isMobile = () => {
    return Boolean(android)
}

//#endregion Variables Mobiles

//#region Variables Globales

let isFlipped = false;
const tempCanvas = document.createElement("canvas");
const tempContext = tempCanvas.getContext("2d");

//#endregion Variables Globales

//#region Carga Inicial
let jsonResponse = [];
let EstaEnGeocerca = 0;
let IdCentroServicio = 0;
let CentroServicio = '';
let htmlContent;
$(document).ready(() => {
    if (!isMobile()) {
        verificarPermisos();
    }
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
                await solicitarPermisoCamara();
            } else {
                $('#divContenedorGps').hide().css({ 'display': 'none', 'visibility': 'hidden', });
                document.getElementById("divContenedorErrorGeocercaContainer").innerHTML = `
                    <div class="container py-4">
                        <div class="card shadow-lg p-3 mb-4 bg-body rounded border border-warning mx-auto" style="max-width: 600px; width: 100%;">
                            <div class="card-body text-center py-3">
                                <p>
                                    <i class="fas fa-7x fa-map-marked-alt text-danger"></i>
                                </p>
                                <h2 class="mb-3 text-danger">No estás en una geocerca válida</h2>
                                <p style="font-size: 18px;">
                                    Para continuar, <strong>debes estar dentro de una geocerca válida.</strong>
                                </p>
                            </div>
                            <div class="container d-flex align-items-center justify-content-center py-3">
                                <button id="recargarButtonGeocerca" class="btn btn-warning">Intentar de nuevo</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error al obtener la ubicación:", error);
            // Mostrar el div de GPS si ocurre un error o se deniega el permiso
            if (error.code === error.PERMISSION_DENIED) {
                $('#divContenedorGps').show();
            } else {
                AlertStackingWithIcon_Mostrar("danger", 'Error al intentar obtener la ubicación.', "fa-times-circle");
                $('#divContenedorGps').show();
            }
        }
    } else {
        AlertStackingWithIcon_Mostrar("danger", 'Tu navegador no soporta la geolocalización.', "fa-times-circle");
        $('#divContenedorGps').show();
    }
};


const solicitarPermisoCamara = async () => {
    await cargarContenedorCamara();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            // Solicitar acceso a la cámara
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // Detener el stream inmediatamente para evitar inicializar la cámara
            stream.getTracks().forEach((track) => track.stop());

            // Ocultar el div de permisos de cámara
            $('#divContenedorCamara').hide();
            // Asegúrate de que se oculte completamente
            $("#divContenedorCamaraContainer").hide().css({
                display: "none",
                visibility: "hidden",
                opacity: "0",
            });

            $('#divContenedorGps').hide();

            // Cargar control de asistencia
            await cargarControlAsistencia(true);

            // Inicializar la cámara una vez que el contenido parcial está cargado
            await inicializarCamara();
        } catch (error) {
            console.error("Error al acceder a la cámara:", error);

            // Mostrar el div de permisos de cámara si los permisos fueron denegados
            $('#divContenedorCamara').show();
        }
    } else {
        AlertStackingWithIcon_Mostrar("danger", 'Tu navegador no soporta el acceso a la cámara.', "fa-times-circle");
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
        isFlipped = settings.facingMode === "user";
        if (isFlipped) {
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
                    IdCentroServicio = jsonResponse[0].Id;
                    CentroServicio = jsonResponse[0].Nombre;
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

$(document).on('click', '#recargarButtonGeocerca', async  () => {
    location.reload();
});

//#endregion

//#region Verificación de permisos dinámicos

// Verifica los permisos de ubicación y cámara y ajusta la interfaz dinámicamente
const verificarPermisos = () => {

    navigator.permissions.query({ name: 'geolocation' }).then(function (permissionStatus) {
        if (permissionStatus.state !== "granted") {
            // Si los permisos de ubicación no están otorgados, mostrar el div de permiso de GPS
            $('#divControlAsistencia').hide();
            $('#divContenedorGps').show();
        }
        permissionStatus.onchange = function () {
            if (permissionStatus.state !== "granted") {
                // Si los permisos de ubicación no están otorgados, mostrar el div de permiso de GPS
                $('#divControlAsistencia').hide();
                $('#divContenedorGps').show();
            }
        };
    });
    navigator.permissions.query({ name: 'camera' }).then(function (permissionStatus) {
        if (permissionStatus.state !== "granted") {
            // Si los permisos de cámara no están otorgados, mostrar el div de restablecer permisos
            $('#divControlAsistencia').hide();
            $('#divContenedorCamara').show();
        }
        permissionStatus.onchange = function () {
            if (permissionStatus.state !== "granted") {
                // Si los permisos de cámara no están otorgados, mostrar el div de restablecer permisos
                $('#divControlAsistencia').hide();
                $('#divContenedorCamara').show();

            }
        };
    });
}

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
            $("#centroServicio").text(jsonResponse[0].Nombre)
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
        if (!searchTerm.trim()) {
            $('#Select_SearchEmpleado').empty();
            $('#Select_SearchEmpleado').prop('disabled', false);
            $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide();
            return;
        }

        const response = await fetch($("#urlSeleccionarDatos").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ParametroBusqueda: searchTerm,
                CentroServicio: jsonResponse[0].Nombre
            })
        });

        if (response.ok) {
            let jsonObject = await response.json();

            if (jsonObject.id === 1 && jsonObject.contenido) {
                const empleados = JSON.parse(jsonObject.contenido).EmpleadoConsulta;

                const optionsArray = empleados.map(empleado => {
                    let [mainText, secondaryText] = empleado.Nombre_Empleado.split('Centro de Servicio:');
                    mainText = mainText.trim();
                    secondaryText = secondaryText ? 'Centro de Servicio: ' + secondaryText.trim() : '';
                    return [empleado.RFC, empleado.Nombre_Empleado, mainText, secondaryText, empleado.Hora_Entrada, empleado.Hora_Salida];
                });

                fillMDBSelect('#Select_SearchEmpleado', optionsArray);

                $('#Select_SearchEmpleado').prop('disabled', false);
                $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide();

                // Evento para detectar cambios en el select y actualizar las horas de entrada/salida
                // Evento para detectar cambios en el select y actualizar las horas de entrada/salida y bloquear radios
                $('#Select_SearchEmpleado').off('change').on('change', function () {
                    const selectedRFC = $(this).val();
                    const empleadoSeleccionado = empleados.find(emp => emp.RFC === selectedRFC);

                    if (empleadoSeleccionado) {
                        // Formatear y mostrar las horas de entrada y salida
                        $("#horaEntrada").text(`Entrada: ${empleadoSeleccionado.Hora_Entrada !== "No registra" ? formatHora(empleadoSeleccionado.Hora_Entrada) : ""}`);
                        $("#horaSalida").text(`Salida: ${empleadoSeleccionado.Hora_Salida !== "No registra" ? formatHora(empleadoSeleccionado.Hora_Salida) : ""}`);

                        // Deshabilitar/Habilitar radios según si el empleado ya tiene una hora registrada
                        if (empleadoSeleccionado.Hora_Entrada !== "No registra") {
                            $('#entradaOption').prop('disabled', true);
                        } else {
                            $('#entradaOption').prop('disabled', false);
                        }

                        if (empleadoSeleccionado.Hora_Salida !== "No registra") {
                            $('#salidaOption').prop('disabled', true);
                        } else {
                            $('#salidaOption').prop('disabled', false);
                        }

                        // Seleccionar automáticamente la opción que sí está habilitada
                        if (!$('#entradaOption').prop('disabled')) {
                            $('#entradaOption').prop('checked', true);
                        } else if (!$('#salidaOption').prop('disabled')) {
                            $('#salidaOption').prop('checked', true);
                        }
                    }
                });

            } else {
                console.error("Error en los datos del servidor");
                $('#Select_SearchEmpleado').empty();
                $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').show();
                $('#Select_SearchEmpleado').prop('disabled', false);
            }
        } else {
            const errorMessage = await response.text();
            throw new Error("Error en la solicitud: " + errorMessage);
        }
    } catch (error) {
        console.error("Error: ", error);
    }
};

// Función para formatear la hora en formato AM/PM
const formatHora = (hora) => {
    if (!hora) return "No registra";
    const date = new Date(hora);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
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

//#region setSelectValue

function setSelectValue(id, value) {
    // Verificar si el valor es null o undefined
    if (value === null || value === undefined) {
        return;
    }

    var selectElement = $(id); // Seleccionamos el elemento

    // Verificar si el elemento existe
    if (!selectElement.length) {
        console.warn(`El elemento con id ${id} no existe.`);
        return;
    }

    var selectInstance = mdb.Select.getInstance(selectElement);

    // Destruir la instancia existente del componente Select si existe
    if (selectInstance) {
        selectInstance.dispose();
    }

    // Establecer el nuevo valor
    var select = new mdb.Select(selectElement[0]);
    select.setValue(value.toString());
}


//#endregion setSelectValue

//#region tomar foto y guardar en ftp

const capturarImagen = async () => {
    startLoadingButton("#Registrar")
    const videoElement = document.getElementById('video');
    const fecha = new Date();

    // Obtén el año
    const year = fecha.getFullYear();

    // Obtén el mes (agregar un 0 si es menor a 10)
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    // Obtén la hora con segundos (agregar un 0 si es menor a 10)
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    const seconds = String(fecha.getSeconds()).padStart(2, '0');
    const nombre = `${hours}${minutes}${seconds}.png`;
    // Combina todo en el formato deseado
    const resultado = `/${year}/${month}/${day}/`;

    // Configurar el tamaño del canvas temporal
    tempCanvas.width = videoElement.videoWidth;
    tempCanvas.height = videoElement.videoHeight;

    // Verificar si el video tiene el transform CSS
    const computedStyle = window.getComputedStyle(videoElement);
    const transformMatrix = computedStyle.transform;

    tempContext.save();

    if (transformMatrix.includes("matrix(-1")) {
        // Aplicar un volteo horizontal
        tempContext.scale(-1, 1);
        tempContext.drawImage(videoElement, -tempCanvas.width, 0, tempCanvas.width, tempCanvas.height);
    } else {
        // Dibujar sin volteo
        tempContext.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    tempContext.restore();

    // Convertir el contenido del canvas a un archivo PNG
    const imageData = tempCanvas.toDataURL("image/png");

    let rfc = $('#Select_SearchEmpleado').val();
    let ClaveEmpleado = $('#Select_SearchEmpleado option:selected').text();
    ClaveEmpleado = ClaveEmpleado.split(" ")[0];
    const ruta = rfc + resultado;
    //rfc = rfc + '.png';

    // Obtener el valor del radio seleccionado
    let seleccionado = $('input[name="entradaSalidaOptions"]:checked').val();

    // Mostrar el resultado
    if (!seleccionado) {
        AlertStackingWithIcon_Mostrar("warning", 'Debes seleccionar el tipo: Entrada o Salida.', "fa-times-circle");
        quitLoadingButton("#Registrar")
        return 0;
    }




    if (rfc == null) {
        AlertStackingWithIcon_Mostrar("warning", 'Debes ecribir tu clave de empleado', "fa-times-circle");
        quitLoadingButton("#Registrar")
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
                Rfc: rfc,
                ClaveEmpleado: ClaveEmpleado,
                TipoAsistencia: seleccionado,
                IdGeocerca: IdCentroServicio.toString()
            })
        });
        if (response.ok) {
            const result = await response.json();
            console.log(result);
            if (result.id) {
                resetearFormulario();
                AlertStackingWithIcon_Mostrar("success", result.contenido, "fa-times-circle");
                quitLoadingButton("#Registrar")

            } else {
                resetearFormulario();
                AlertStackingWithIcon_Mostrar("warning", result.contenido, "fa-times-circle");
                quitLoadingButton("#Registrar")

            }
        } else {
            throw new Error('Error al guardar la imagen.');
        }
    } catch (error) {
        console.error('Error:', error);
        resetearFormulario();
        AlertStackingWithIcon_Mostrar("danger", 'No se pudo guardar la imagen.', "fa-times-circle");
        quitLoadingButton("#Registrar")
    }
};


//#region Resetear Entrada Salida Empleado

const resetearFormulario = () => {
    seleccionarEntradaSalidaPorDefecto();

    setSelectValue("#Select_SearchEmpleado", 0);
    let selectElement = $('#Select_SearchEmpleado');
    selectElement.empty(); // Limpiar el select completamente
    selectElement.removeClass('disabled'); // Asegurarse de que el select esté habilitado
    $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide(); // Ocultar "Sin resultados"

    setTimeout(() => {
        // Quitar la clase "active" del label de manera explícita
        $("#select-wrapper-Select_SearchEmpleado .form-label.select-label").removeClass("active");
    }, 100);

    // Eliminar el div de "Seleccionar"
    $("#select-wrapper-Select_SearchEmpleado .select-fake-value").remove();

    // Restablecer el texto de las etiquetas de entrada/salida
    $("#horaEntrada").text('Entrada: ');
    $("#horaSalida").text('Salida: ');
};


//#endregion Resetear Entrada Salida Empleado

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

//#region AlertStackingWithIcon_Mostrar

function AlertStackingWithIcon_Mostrar(Color, Texto, Icono) {
    const alert = document.createElement('div');
    alert.innerHTML = `
        <i class="fas ${Icono} me-3"></i>${Texto}
        <button type="button" class="btn-close" data-mdb-dismiss="alert" aria-label="Close"></button>
    `;
    alert.classList.add('alert', 'fade', 'alert-dismissible');
    document.body.appendChild(alert);
    const alertInstance = new mdb.Alert(alert, {
        color: Color,
        stacking: true,
        hidden: true,
        //width: '450px',
        width: '400px',
        position: 'top-center',
        autohide: true,
        delay: 5000,
    });
    alertInstance.show();

    //Sirve para eliminarlo del html una vez termine de aparecer la notificación
    setTimeout(() => {
        alertInstance.close();
    }, 5000);
}

//#endregion AlertStackingWithIcon_Mostrar

//#region startLoadingButton

function startLoadingButton(id) {
    // Verificar si el botón ya está en estado de carga
    $('.custom-tooltip').remove();
    $(id).trigger('mouseleave');

    if ($(id).data('loading')) {
        return; // Si ya está en estado de carga, no hacer nada
    }

    // Guardar el estado original del botón en un atributo de datos
    $(id).data('original-text', $(id).html());

    // Deshabilitar todos los botones y guardar su estado
    $('button').each(function () {
        var button = $(this);
        if (!button.prop('disabled')) {
            button.data('previously-enabled', true);
        }
        button.prop('disabled', true);
    });

    // Cambiar el contenido del botón que inició la carga
    $(id).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');

    // Marcar el botón como en estado de carga
    $(id).data('loading', true);
}

function quitLoadingButton(id) {
    // Restaurar el estado original del botón
    $('.custom-tooltip').remove();
    var originalText = $(id).data('original-text');
    $(id).html(originalText);
    $(id).prop("disabled", false);

    // Limpiar el atributo de datos que contenía el estado original
    $(id).removeData('original-text');
    $(id).removeData('loading');

    // Restaurar el estado de los botones que fueron deshabilitados previamente
    $('button').each(function () {
        var button = $(this);
        if (button.data('previously-enabled')) {
            button.prop('disabled', false);
            button.removeData('previously-enabled');
        }
    });
}

//#endregion startLoadingButton


function stopCamera(videoElement) {
    if (videoElement.srcObject) {
        let stream = videoElement.srcObject;
        let tracks = stream.getTracks();

        tracks.forEach(track => track.stop()); // Detiene cada pista (audio/video)
        videoElement.srcObject = null; // Limpia el objeto de la cámara
    }
}

window.addEventListener("beforeunload", () => {
    const videoElement = document.getElementById('video');

    stopCamera(videoElement);
});