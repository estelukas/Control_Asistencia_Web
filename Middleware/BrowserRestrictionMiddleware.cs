namespace XCF_Web_Control_Asistencia.Middleware
{
    using Microsoft.AspNetCore.Mvc.ModelBinding;
    using Microsoft.AspNetCore.Mvc.Rendering;
    using Microsoft.AspNetCore.Mvc.ViewEngines;
    using Microsoft.AspNetCore.Mvc.ViewFeatures;
    using Microsoft.AspNetCore.Mvc;

    public class BrowserRestrictionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ICompositeViewEngine _viewEngine;
        private readonly IServiceProvider _serviceProvider;

        public BrowserRestrictionMiddleware(RequestDelegate next, ICompositeViewEngine viewEngine, IServiceProvider serviceProvider)
        {
            _next = next;
            _viewEngine = viewEngine;
            _serviceProvider = serviceProvider;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var userAgent = context.Request.Headers["User-Agent"].ToString();

            if (!EsNavegadorChrome(userAgent))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "text/html";

                // Renderizar el Partial View
                var partialViewContent = await RenderPartialViewToString(context, "_UnsupportedBrowser");
                await context.Response.WriteAsync(partialViewContent);
                return;
            }

            await _next(context);
        }

        private bool EsNavegadorChrome(string userAgent)
        {
            return !string.IsNullOrEmpty(userAgent) && userAgent.Contains("Chrome") && !userAgent.Contains("Edg");
        }

        private async Task<string> RenderPartialViewToString(HttpContext context, string partialViewName)
        {
            using var writer = new StringWriter();

            var viewResult = _viewEngine.FindView(new ActionContext(context, new Microsoft.AspNetCore.Routing.RouteData(), new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor()), partialViewName, false);

            if (viewResult.Success)
            {
                var viewData = new ViewDataDictionary(new EmptyModelMetadataProvider(), new ModelStateDictionary());
                var tempData = _serviceProvider.GetService<ITempDataDictionaryFactory>()?.GetTempData(context);

                var viewContext = new ViewContext(
                    new ActionContext(context, new Microsoft.AspNetCore.Routing.RouteData(), new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor()),
                    viewResult.View,
                    viewData,
                    tempData,
                    writer,
                    new HtmlHelperOptions()
                );

                await viewResult.View.RenderAsync(viewContext);
                return writer.ToString();
            }

            return "<h1>Error: No se pudo cargar el Partial View</h1>";
        }
    }
}
