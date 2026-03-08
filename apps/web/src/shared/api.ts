export interface ApiSpell {
  id: string;
  name: string;
  level?: number;
  source?: string[];
  spellList?: string[];
  save?: string;
  castingTime?: string;
  notes?: string;
  description?: string;
  school?: string;
  duration?: string;
  range?: string;
  components?: string;
  component?: string;
  tags?: string[];
  prepared?: boolean;
}

export interface SpellsResponse {
  count?: number;
  spells: ApiSpell[];
}
