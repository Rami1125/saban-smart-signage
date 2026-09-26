// ============================================================================
// Exact Geofencing Coordinates & Metadata for Saban Branches
// ח. סבן חומרי בניין (1994) בע״מ
// ============================================================================

export interface BranchCoords {
  id: "harash" | "talmid";
  name: string;
  shortName: string;
  address: string;
  lat: number;
  lng: number;
  hoursWeekday: string;
  hoursFriday: string;
  phone: string;
  contact: string;
  specialty: string;
}

export const BRANCH_HARASH: BranchCoords = {
  id: "harash",
  name: "סניף החרש 10 (מגרש ראשי - מחסן 4)",
  shortName: "סניף החרש 10",
  address: "רחוב החרש 10, הוד השרון",
  lat: 32.13267073587116,
  lng: 34.898239515341515,
  hoursWeekday: "06:30–16:00",
  hoursFriday: "06:30–13:30",
  phone: "050-4482285",
  contact: "איציק זהבי (מנהל דלפק החרש)",
  specialty: "מליטה, מלט, טיט, בלוקים, ברזל, אגרגטים ואיטום כבד",
};

export const BRANCH_TALMID: BranchCoords = {
  id: "talmid",
  name: "סניף התלמיד 6 (אולם גבס וצבע - מחסן 1)",
  shortName: "סניף התלמיד 6",
  address: "רחוב התלמיד 6, הוד השרון",
  lat: 32.16308876819676,
  lng: 34.894851604939035,
  hoursWeekday: "06:30–18:00",
  hoursFriday: "06:30–14:00",
  phone: "050-7855865",
  contact: "יואב (מנהל אולם התלמיד)",
  specialty: "מערכות גבס, צבעים וגיוון ממוחשב, שפכטלים, פרזול וכלי עבודה",
};

export const GEOFENCE_RADIUS_METERS = 250;
