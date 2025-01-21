using System.ComponentModel.DataAnnotations;

namespace XCF_Web_Control_Asistencia.Models.Genericos
{
    public class mTexto
    {
        /// <summary>
        /// Devuelve un valor de Texto/string
        /// </summary>
        [Required(ErrorMessage = "El dato es requerido.")]
        [DataType(DataType.Text)]
        [StringLength(50, ErrorMessage = "Excede el máximo de caracteres permitido.")]
        [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Ese no es un correo electrónico válido.")]
        public string Texto { get; set; }
    }
}
