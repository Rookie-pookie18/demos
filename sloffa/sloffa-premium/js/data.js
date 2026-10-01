/* SLOFFA (fictional) — shared data: palette, customisable parts, the three models. */

export const SWATCHES = [
  { name: 'Nap Pink', hex: '#F7A8C4' },
  { name: 'Pyjama Blue', hex: '#3D5AFE' },
  { name: 'Tomato', hex: '#FF5A36' },
  { name: 'Lilac', hex: '#C9B6FF' },
  { name: 'Highlighter', hex: '#E8FF4F' },
  { name: 'Mint Sofa', hex: '#9EE6C5' },
  { name: 'Mustard', hex: '#F2B63D' },
  { name: 'Sky Daydream', hex: '#8FD3FF' },
  { name: 'Oat', hex: '#F4EEE2' },
  { name: 'Midnight', hex: '#1C1A17' },
];

// customisable parts, in the order the customiser lists them
export const PARTS = [
  { key: 'upper', label: 'Upper' },
  { key: 'stripe', label: 'Droop stripe' },
  { key: 'midsole', label: 'Cloud sole' },
  { key: 'outsole', label: 'Outsole' },
  { key: 'laces', label: 'Laces' },
  { key: 'tongue', label: 'Tongue' },
  { key: 'heel', label: 'Heel tab' },
];

export const DEFAULT_COLORS = {
  upper: '#F7A8C4', stripe: '#FF5A36', midsole: '#F4EEE2', outsole: '#FF5A36',
  laces: '#C9B6FF', tongue: '#F7A8C4', heel: '#3D5AFE',
};

export const MODELS = {
  snooze: {
    slug: 'snooze', name: 'The Snooze', type: 'lowtop', kind: 'Low-top', weight: 212, price: 4999,
    line: 'For people who still technically own laces.',
    pitch: 'Our original lazy low-top. A knit upper that breathes so you don\'t have to, a cloud sole that does the walking, and fat laces you can tie once and never think about again.',
    colorways: [
      { name: 'Nap Pink', colors: { ...DEFAULT_COLORS } },
      { name: 'Sunday Blue', colors: { upper: '#3D5AFE', stripe: '#E8FF4F', midsole: '#F4EEE2', outsole: '#1C1A17', laces: '#F4EEE2', tongue: '#3D5AFE', heel: '#FF5A36' } },
      { name: 'Mint Sofa', colors: { upper: '#9EE6C5', stripe: '#3D5AFE', midsole: '#F4EEE2', outsole: '#F2B63D', laces: '#F7A8C4', tongue: '#9EE6C5', heel: '#F2B63D' } },
    ],
    specs: [['Weight', '212 g (UK 9)'], ['Heel drop', '8 mm, all downhill'], ['Upper', 'Recycled knit, very breathable'], ['Midsole', 'CloudNap foam, 38% air'], ['Sizes', 'UK 5–12'], ['Lacing', 'Tie once. Forget forever.']],
    notFor: ['Marathons', 'Being early', 'Taking the stairs when there\'s a lift'],
  },
  couch: {
    slug: 'couch', name: 'The Couch', type: 'slipon', kind: 'Slip-on', weight: 198, price: 4499,
    line: 'No laces. No tongue. No questions.',
    pitch: 'A slip-on for people who find laces a bit much. Stretchy knit, a wide elastic collar, and two fat straps that hold on so you don\'t have to.',
    colorways: [
      { name: 'Pyjama Blue', colors: { upper: '#3D5AFE', stripe: '#F7A8C4', midsole: '#F4EEE2', outsole: '#FF5A36', laces: '#1C1A17', tongue: '#3D5AFE', heel: '#E8FF4F' } },
      { name: 'Oat Milk', colors: { upper: '#F4EEE2', stripe: '#FF5A36', midsole: '#F4EEE2', outsole: '#C9B6FF', laces: '#C9B6FF', tongue: '#F4EEE2', heel: '#FF5A36' } },
      { name: 'Midnight Snack', colors: { upper: '#1C1A17', stripe: '#E8FF4F', midsole: '#F4EEE2', outsole: '#E8FF4F', laces: '#F7A8C4', tongue: '#1C1A17', heel: '#E8FF4F' } },
    ],
    specs: [['Weight', '198 g (UK 9)'], ['Heel drop', '6 mm'], ['Upper', 'Stretch knit, elastic collar'], ['Midsole', 'CloudNap foam, 38% air'], ['Sizes', 'UK 5–12'], ['Lacing', 'None. That\'s the point.']],
    notFor: ['Tying things', 'Bending down', 'Any sentence starting with "quick run?"'],
  },
  nope: {
    slug: 'nope', name: 'The Nope', type: 'slide', kind: 'Slide', weight: 164, price: 2999,
    line: 'The shoe equivalent of "seen".',
    pitch: 'One puffy strap, a thick cloud footbed and absolutely no commitment. For the fridge run, the balcony and the long walk to the sofa.',
    colorways: [
      { name: 'Tomato', colors: { upper: '#FF5A36', stripe: '#FF5A36', midsole: '#F4EEE2', outsole: '#C9B6FF', laces: '#FF5A36', tongue: '#FF5A36', heel: '#FF5A36' } },
      { name: 'Highlighter', colors: { upper: '#E8FF4F', stripe: '#E8FF4F', midsole: '#F4EEE2', outsole: '#3D5AFE', laces: '#E8FF4F', tongue: '#E8FF4F', heel: '#E8FF4F' } },
      { name: 'Lilac Lounge', colors: { upper: '#C9B6FF', stripe: '#C9B6FF', midsole: '#F4EEE2', outsole: '#F7A8C4', laces: '#C9B6FF', tongue: '#C9B6FF', heel: '#C9B6FF' } },
    ],
    specs: [['Weight', '164 g (UK 9)'], ['Footbed', 'Contoured CloudNap, 32 mm'], ['Strap', 'One. Puffy. Enough.'], ['Outsole', 'Wavy grip, lilac'], ['Sizes', 'UK 5–12'], ['Effort', 'Approximately none']],
    notFor: ['Hiking', 'Formal dinners (allegedly)', 'Running for the bus. Let it go.'],
  },
};

export const ORDER = ['snooze', 'couch', 'nope'];

export const inr = (n) => '₹' + n.toLocaleString('en-IN');
