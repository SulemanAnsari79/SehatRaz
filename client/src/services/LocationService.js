import API from "./Api";

export const getDeliveryLocations = async () => {
  try {
    const response = await API.get('/user/delivery-locations');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch delivery locations:', error);
    return { success: false, locations: { isEnabled: false, cities: [], states: [], countries: [], pincodes: [], }};
  }
};
