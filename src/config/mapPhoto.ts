/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-require-imports */
// Central place to read the Google Maps Static API key.
// Prefers local file, then env variables as fallback. Works even if mapPhoto.local.ts is absent.
let LOCAL_GMAPS_KEY = "";
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-assertions
  const local = require("./mapPhoto.local") as { GMAPS_KEY?: string };
  LOCAL_GMAPS_KEY = local?.GMAPS_KEY || "";
} catch {
  // ignore if local file is missing in build environments
}

export const mapPhotoConfig = {
  gmapsKey: LOCAL_GMAPS_KEY || process.env.GMAPS_KEY || process.env.NEXT_PUBLIC_GMAPS_KEY || "",
};
