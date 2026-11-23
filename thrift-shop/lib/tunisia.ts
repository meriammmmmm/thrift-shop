/**
 * The governorates of Tunisia.
 *
 * The delivery form asks for the governorate before the city, because
 * the governorate is what tells the shop where the order is going.
 */
export const GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Béja',
  'Jendouba',
  'Le Kef',
  'Siliana',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Gafsa',
  'Tozeur',
  'Kébili',
  'Gabès',
  'Médenine',
  'Tataouine',
] as const;

export type Governorate = (typeof GOVERNORATES)[number];
