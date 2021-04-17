using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using AmirKouretchianWeb.Models;
using AmirKouretchianWeb.Services;

namespace AmirKouretchianWeb.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IConfiguration _config;
        private MathService _service;

        public HomeController(ILogger<HomeController> logger, IConfiguration config, MathService mathSvc)
        {
            _logger = logger;
            _config = config;
            _service = mathSvc;
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
        public async Task<IActionResult> MathServiceSubmit(string additionInput)
        {
            string mathServiceUrl = _config.GetValue<string>("MathServiceUrl");
            string apiKey = _config.GetValue<string>("ApiKey");

            if (String.IsNullOrEmpty(additionInput))
                this.TempData["error"] = "Please enter a comma-delimited list of numbers to add up";
            else
            {
                HttpResponseMessage response = await _service.GetSum(additionInput);
                string responseBody = await response.Content.ReadAsStringAsync();
                if(response.IsSuccessStatusCode){
                    this.TempData["success"] = "Sum of " + additionInput + " is: " + responseBody;
                }else{
                    this.TempData["error"] = response.ReasonPhrase + " " + responseBody;
                }
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
