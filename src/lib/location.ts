export async function getCoordinates(city: string) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${city}`;
  
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Erro ao buscar localização");
    }
  
    const data = await response.json();
    if (data.length === 0) {
      throw new Error("Cidade não encontrada");
    }
  
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  }
  