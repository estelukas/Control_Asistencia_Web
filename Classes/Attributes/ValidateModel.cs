using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

namespace XCF_Web_Control_Asistencia.Classes.Attributes
{
    public class ValidateModel: ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                var errors = new List<string>();

                foreach (var modelState in context.ModelState.Values)
                {
                    foreach (var error in modelState.Errors)
                    {
                        errors.Add(error.ErrorMessage);
                    }
                }

                // Puedes personalizar el contenido del mensaje de alerta según tus necesidades.
                var errorMessage = string.Join("\n", errors);

                // Puedes cambiar esto para devolver un resultado diferente si es necesario.
                context.Result = new BadRequestObjectResult(errorMessage);
            }
        }
    }
}
