
namespace XCF_Web_Control_Asistencia.Models.Genericos
{
    using Newtonsoft.Json;
    using System.ComponentModel.DataAnnotations;

    public class mArregloBytes
    {
        /// <summary>
        /// Arreglo de Bytes
        /// </summary>
        [JsonProperty("arregloBytes")]
        [Required(ErrorMessage = "El dato es requerido.")]
        public byte[] ArregloBytes { get; set; }
    }
}
