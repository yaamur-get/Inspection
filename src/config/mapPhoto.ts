// Central place to read the Google Maps Static API key.
// Prefers local file, then env variables as fallback.
import { GMAPS_KEY as LOCAL_GMAPS_KEY } from "./mapPhoto.local";

export const mapPhotoConfig = {
  gmapsKey: LOCAL_GMAPS_KEY || process.env.GMAPS_KEY || process.env.NEXT_PUBLIC_GMAPS_KEY || "",
};
