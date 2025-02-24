using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc;

public static class ViewRenderHelper
{
    public static async Task<string> RenderPartialViewToString(HttpContext context, string partialViewName)
    {
        var viewEngine = context.RequestServices.GetService<ICompositeViewEngine>();
        var serviceProvider = context.RequestServices.GetService<IServiceProvider>();

        using var writer = new StringWriter();
        var viewResult = viewEngine.FindView(new ActionContext(context, new RouteData(), new ActionDescriptor()), partialViewName, false);

        if (viewResult.Success)
        {
            var viewData = new ViewDataDictionary(new EmptyModelMetadataProvider(), new ModelStateDictionary());
            var tempData = serviceProvider.GetService<ITempDataDictionaryFactory>().GetTempData(context);

            var viewContext = new ViewContext(
                new ActionContext(context, new RouteData(), new ActionDescriptor()),
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
