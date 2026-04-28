export interface HomedataProperty {
  uprn: string;
  address: string;
  postcode: string;
  epc_rating: string;
  total_floor_area: number;
  raw: any;
}

export async function searchProperties(address: string): Promise<HomedataProperty[]> {
  try {
    const response = await fetch(`/api/search-property?query=${encodeURIComponent(address)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(errorData.error || 'No properties found');
      error.status = response.status;
      error.details = errorData.details;
      throw error;
    }

    const data = await response.json();
    return data.results || [];
  } catch (error: any) {
    console.error('Failed to search Homedata properties:', error);
    throw error;
  }
}
