using Microsoft.AspNetCore.Mvc;
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

        #region Dashboard

        /// <summary>
        /// Pantalla de Control de Asistencia
        /// </summary>
        /// <returns>View</returns>
        //[ValidarSesion]
        //[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public IActionResult ControlAsistencia()
        {
            return View();
        }

        #endregion

        /// <summary>
        /// Consultar Datos de empleados
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
        #region comparacionFotos
        /// <summary>
        /// Guardar la foto en ftp
        /// </summary>
        /// <returns>Json</returns>
        [HttpPost]
        public IActionResult GuardarFoto([FromBody] mImagenRequest model)
        {
            try
            {
                mSelect r = _apiHandler.PostAsync<mImagenRequest, mSelect>(_apiHandler.UrlControlAsistencia + "controlasistencia/GuardarFoto", model).Result;

                return Json(r);
            }
            catch (Exception)
            {
                return BadRequest("Ocurrió un error, vuelve a intentarlo.");
            }
        }
        #endregion compracionFotos
    }
}
