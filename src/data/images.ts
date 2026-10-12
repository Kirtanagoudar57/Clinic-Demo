/**
 * All photography is royalty-free stock (Unsplash) used as demo placeholders.
 * Replace these URLs with the clinic's own photos before going live.
 * Every image is rendered through <SafeImage>, which falls back to a branded
 * illustration if a URL fails to load.
 */
import clinicRoom from '../assets/clinic-treatment-room.png'
import dentalCheckup from '../assets/dental-checkup.png'

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`

export const images = {
  // Clinic-supplied photos, bundled locally so they always load.
  hero: clinicRoom,
  about: u('photo-1606811971618-4486d14f3f99'),
  aboutSecondary: dentalCheckup,
  booking: u('photo-1609840114035-3c981b782dfe', 900),
  services: {
    checkup: dentalCheckup,
    cleaning: u('photo-1606811971618-4486d14f3f99', 700),
    filling: u('photo-1598256989800-fe5f95da9787', 700),
    rootCanal: u('photo-1629909613654-28e377c37b09', 700),
    extraction: u('photo-1609840114035-3c981b782dfe', 700),
    whitening: u('photo-1606265752439-1f18756aa5fc', 700),
    gum: u('photo-1598256989800-fe5f95da9787', 700),
    consultation: u('photo-1588776814546-1ffcf47267a5', 700),
  },
  dentists: {
    a: u('photo-1559839734-2b71ea197ec2', 600),
    b: u('photo-1612349317150-e413f6a5b16d', 600),
    c: u('photo-1594824476967-48c8b964273f', 600),
  },
}
