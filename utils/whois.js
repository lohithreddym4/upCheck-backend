const WHOIS_API_KEY = '75c84088e1mshf9539f1e2d0626ep1ffc03jsnd78b21ea46b0';
const WHOIS_API_HOST = 'whois-by-api-ninjas.p.rapidapi.com';
const WHOIS_API_BASE_URL = 'https://whois-by-api-ninjas.p.rapidapi.com/v1/whois?domain=';

async function getWhoisData(url) {
    const apiUrl = `${WHOIS_API_BASE_URL}${url}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': WHOIS_API_KEY,
        'X-RapidAPI-Host': WHOIS_API_HOST,
      },
    };
  
    try {
      const response = await fetch(apiUrl, options);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching Whois data:', error);
      return {};
    }
}
module.exports = getWhoisData;