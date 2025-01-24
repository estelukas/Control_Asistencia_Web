using Microsoft.AspNetCore.Mvc;
using XCF_Web.Models.Genericos;
using XCF_Web_Control_Asistencia.Classes;
using XCF_Web_Control_Asistencia.Classes.Attributes;
using XCF_Web_Control_Asistencia.Models.Genericos;
using XCF_Web_Control_Asistencia.Models.Imagenes;

namespace XCF_Web_Control_Asistencia.Controllers.ControlAsistencia
{
    [ValidateModel]
    public class ControlAsistenciaController(ApiHandler apiHandler) : Controller
    {
        private readonly ApiHandler _apiHandler = apiHandler ?? throw new ArgumentNullException(nameof(apiHandler));

        #region Control Asistencia

        /// <summary>
        /// Pantalla de Control de Asistencia
        /// </summary>
        /// <returns>View</returns>
        ///[ValidarSesion]
        ///[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public IActionResult ControlAsistencia()
        {
            return View();
        }

        #region Control Asistencia Seleccionar Datos

        /// <summary>
        /// Buscar Empleado mediante su Clave, Nombre, Centro de Servicio y Mostrarlo en cierto formato
        /// </summary>
        /// <returns>Json</returns>
        [HttpPost]
        public IActionResult Control_Asistencia_SeleccionarDatos([FromBody] mIdUsuario model)
        {
            try
            {
                mSelect r = _apiHandler.PostAsync<mIdUsuario, mSelect>(_apiHandler.UrlControlAsistencia + "controlasistencia/Control_Asistencia_SeleccionarDatos", model).Result;

                return Json(r);
            }
            catch (Exception)
            {
                return BadRequest("Ocurrió un error, vuelve a intentarlo.");
            }
        }

        #endregion Control Asistencia Seleccionar Datos

        #region comparacionFotos
        /// <summary>
        /// Consultar si los dos rostros se parecen
        /// </summary>
        /// <returns>Json</returns>
        [HttpPost]
        public IActionResult CompararRostro([FromBody] mIdUsuario model)
        {
            try
            {
                mSelect r = _apiHandler.PostAsync<mIdUsuario, mSelect>(_apiHandler.UrlControlAsistencia + "controlasistencia/CompararRostro", model).Result;

                return Json(r);
            }
            catch (Exception)
            {
                return BadRequest("Ocurrió un error, vuelve a intentarlo.");
            }
        }
        #endregion compracionFotos

        #region Control Asistencia Guardar Información Asistencia

        /// <summary>
        /// Guardar la información de la Asistencia del Usuario
        /// </summary>
        /// <returns>Json</returns>
        [HttpPost]
        public IActionResult Control_Asistencia_GuardarInformacionAsistencia([FromBody] mImagenRequest model)
        {
            try
            {
                mSelect r = _apiHandler.PostAsync<mImagenRequest, mSelect>(_apiHandler.UrlControlAsistencia + "controlasistencia/Control_Asistencia_GuardarInformacionAsistencia", model).Result;

                return Json(r);
            }
            catch (Exception)
            {
                return BadRequest("Ocurrió un error, vuelve a intentarlo.");
            }
        }

        #endregion Control Asistencia Guardar Información Asistencia

        #region Control Asistencia Guardar Foto Servidor FTP
        /// <summary>
        /// Insertar Foto en Servidor
        /// </summary>
        /// <returns>Json</returns>
        [HttpPost]
        public IActionResult Control_Asistencia_ServidorFTP_GuardarFoto([FromBody] mImagenRequest model)
        {
            try
            {
                List<mImagenRequest> l = _apiHandler.PostAsync<mImagenRequest, List<mImagenRequest>>(_apiHandler.UrlControlAsistencia + "controlasistencia/Control_Asistencia_ServidorFTP_GuardarFoto", model).Result;


                return Json(l);
            }
            catch (Exception)
            {
                return BadRequest("Ocurrió un error, vuelve a intentarlo.");
            }
        }
        #endregion Control Asistencia Guardar Foto Servidor FTP

        #region Control Asistencia Validar Geocerca

        /// <summary>
        /// Validar si la Ubicación del Usuario esta Dentro de la Geocerca del Centro de Servicio
        /// </summary>
        /// <returns>Json</returns>
        [HttpPost]
        public IActionResult Control_Asistencia_ValidarGeocerca([FromBody] mIdUsuario model)
        {
            try
            {
                mSelect r = _apiHandler.PostAsync<mIdUsuario, mSelect>(_apiHandler.UrlControlAsistencia + "controlasistencia/Control_Asistencia_ValidarGeocerca", model).Result;

                return Json(r);
            }
            catch (Exception)
            {
                return BadRequest("Ocurrió un error, vuelve a intentarlo.");
            }
        }

        #endregion Control Asistencia Validar Geocerca

        #endregion Control Asistencia



    }
}
