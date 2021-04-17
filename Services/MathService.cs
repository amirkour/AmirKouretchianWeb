using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;


namespace AmirKouretchianWeb.Services
{
    public class MathService
    {
        protected HttpClient _client;
        protected readonly IConfiguration _config;
        
        public MathService(HttpClient client, IConfiguration config){
            _client = client;
            _config = config;

            _client.BaseAddress = new Uri(_config.GetValue<string>("MathServiceUrl"));
            _client.DefaultRequestHeaders.Add("Api-key", _config.GetValue<string>("ApiKey"));
            _client.DefaultRequestHeaders.Add("Accept", "application/json");
            _client.DefaultRequestHeaders.Add("Access-Control-Allow-Origin", "*");
        }

        public async Task<HttpResponseMessage> GetSum(string commaDelimitedNumbers){
            HttpResponseMessage response = await _client.PostAsync("/api/v1/math/add", JsonContent.Create<string[]>(commaDelimitedNumbers.Split(',')));
            return response;
        }
    }
}