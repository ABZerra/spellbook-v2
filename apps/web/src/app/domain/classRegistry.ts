export interface ClassRegistryEntry {
  name: string;
  subclasses: string[];
}

/**
 * Official 2014 D&D 5e spellcasting classes and subclasses.
 * Source of truth: dndbeyond.com (Legacy / 2014 rules).
 * Includes PHB, XGtE, TCoE, SCAG, EGtW, VRGtR, FToD, DSotDQ, ERftLW, DMG.
 */
export const CLASS_REGISTRY: ClassRegistryEntry[] = [
  {
    name: 'Artificer',
    subclasses: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith'],
  },
  {
    name: 'Bard',
    subclasses: [
      'College of Creation',
      'College of Eloquence',
      'College of Glamour',
      'College of Lore',
      'College of Spirits',
      'College of Swords',
      'College of Valor',
      'College of Whispers',
    ],
  },
  {
    name: 'Cleric',
    subclasses: [
      'Arcana Domain',
      'Death Domain',
      'Forge Domain',
      'Grave Domain',
      'Knowledge Domain',
      'Life Domain',
      'Light Domain',
      'Nature Domain',
      'Order Domain',
      'Peace Domain',
      'Tempest Domain',
      'Trickery Domain',
      'Twilight Domain',
      'War Domain',
    ],
  },
  {
    name: 'Druid',
    subclasses: [
      'Circle of Dreams',
      'Circle of Spores',
      'Circle of Stars',
      'Circle of the Land',
      'Circle of the Moon',
      'Circle of the Shepherd',
      'Circle of Wildfire',
    ],
  },
  {
    name: 'Fighter',
    subclasses: ['Eldritch Knight'],
  },
  {
    name: 'Paladin',
    subclasses: [
      'Oath of Conquest',
      'Oath of Devotion',
      'Oath of Glory',
      'Oath of Redemption',
      'Oath of the Ancients',
      'Oath of the Crown',
      'Oath of the Watchers',
      'Oath of Vengeance',
      'Oathbreaker',
    ],
  },
  {
    name: 'Ranger',
    subclasses: [
      'Beast Master',
      'Drakewarden',
      'Fey Wanderer',
      'Gloom Stalker',
      'Horizon Walker',
      'Hunter',
      'Monster Slayer',
      'Swarmkeeper',
    ],
  },
  {
    name: 'Rogue',
    subclasses: ['Arcane Trickster'],
  },
  {
    name: 'Sorcerer',
    subclasses: [
      'Aberrant Mind',
      'Clockwork Soul',
      'Draconic Bloodline',
      'Divine Soul',
      'Lunar Sorcery',
      'Shadow Magic',
      'Storm Sorcery',
      'Wild Magic',
    ],
  },
  {
    name: 'Warlock',
    subclasses: [
      'The Archfey',
      'The Celestial',
      'The Fathomless',
      'The Fiend',
      'The Genie',
      'The Great Old One',
      'The Hexblade',
      'The Undead',
      'The Undying',
    ],
  },
  {
    name: 'Wizard',
    subclasses: [
      'Bladesinging',
      'Chronurgy Magic',
      'Graviturgy Magic',
      'Order of Scribes',
      'School of Abjuration',
      'School of Conjuration',
      'School of Divination',
      'School of Enchantment',
      'School of Evocation',
      'School of Illusion',
      'School of Necromancy',
      'School of Transmutation',
      'War Magic',
    ],
  },
];
