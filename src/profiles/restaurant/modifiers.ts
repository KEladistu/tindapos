export interface ModifierOption {
  id: string;
  name: string;
  priceDeltaCentavos: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  select: 'single' | 'multi';
  required?: boolean;
  options: ModifierOption[];
}

export interface SelectedMod {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCentavos: number;
}

export const RICE_SIZE: ModifierGroup = {
  id: 'rice-size',
  name: 'Rice size',
  select: 'single',
  required: true,
  options: [
    { id: 'regular', name: 'Regular', priceDeltaCentavos: 0 },
    { id: 'extra', name: 'Extra Rice', priceDeltaCentavos: 1500 }
  ]
};

export const ADD_ONS: ModifierGroup = {
  id: 'add-ons',
  name: 'Add-ons',
  select: 'multi',
  options: [
    { id: 'extra-rice', name: 'Extra rice', priceDeltaCentavos: 1500 },
    { id: 'egg', name: 'Egg', priceDeltaCentavos: 1500 },
    { id: 'extra-sauce', name: 'Extra sauce', priceDeltaCentavos: 0 }
  ]
};

export const SISIG_STYLE: ModifierGroup = {
  id: 'style',
  name: 'Style',
  select: 'single',
  required: true,
  options: [
    { id: 'regular', name: 'Regular', priceDeltaCentavos: 0 },
    { id: 'spicy', name: 'Spicy', priceDeltaCentavos: 0 },
    { id: 'no-onion', name: 'No onion', priceDeltaCentavos: 0 }
  ]
};
