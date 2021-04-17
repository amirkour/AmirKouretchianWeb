using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using AmirKouretchianWeb.Models;

namespace AmirKouretchianWeb.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IConfiguration _config;

        public HomeController(ILogger<HomeController> logger, IConfiguration config)
        {
            _logger = logger;
            _config = config;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult ReactTODOs()
        {
            return View();
        }

        public IActionResult MathService()
        {
            MathServiceViewModel viewModel = new MathServiceViewModel();
            string error = (string)this.TempData["error"];
            if (!String.IsNullOrEmpty(error))
                viewModel.Error = error;

            string success = (string)this.TempData["success"];
            if (!string.IsNullOrEmpty(success))
                viewModel.Success = success;

            return View(model: viewModel);
        }

        [HttpPost]
        public IActionResult MathServiceSubmit(string additionInput)
        {
            string mathServiceUrl = _config.GetValue<string>("MathServiceUrl");
            string apiKey = _config.GetValue<string>("ApiKey");

            if (String.IsNullOrEmpty(additionInput))
                this.TempData["error"] = "Please enter a comma-delimited list of numbers to add up";
            else if (String.IsNullOrEmpty(mathServiceUrl))
                this.TempData["error"] = "This page require a service URL that is missing - please contact the page administrator for assistance";
            else if (String.IsNullOrEmpty(apiKey))
                this.TempData["error"] = "This page requires an API key to communicate with the math service - please contact a web admin to assist you";
            else
            {
                this.TempData["success"] = "TODO";
            }

            return RedirectToAction("MathService");
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
