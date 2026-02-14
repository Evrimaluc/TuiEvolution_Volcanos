import axios from 'axios';

const API_URL = 'https://tuievolution-volcanos-backend.onrender.com';

export const runSimulation = async (volcanoData) => {
    try {
        const response = await axios.post(`${API_URL}/calculate`, {
            name: volcanoData.name,
            elevation: volcanoData.elevation,
            status: volcanoData.status, // Backend artık bunu kullanıyor
            location: { 
                lat: volcanoData.position[0], 
                lng: volcanoData.position[1] 
            }
        });
        return response.data;
    } catch (error) {
        console.error("Simülasyon Hatası:", error);
        throw error;
    }
};