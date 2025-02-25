export async function getWeather(lat: number, lon: number) {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
  
    const response = await fetch(url, {
      headers: {
        "User-Agent": "gisellySeuNome/1.0 (giselly.avpereira@gmail.com)", // Coloque seu e-mail aqui
      },
    });
  
    if (!response.ok) {
      throw new Error("Erro ao buscar o clima");
    }
  
    const data = await response.json();
    return data;
  }
  