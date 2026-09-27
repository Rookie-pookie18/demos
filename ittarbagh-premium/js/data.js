/* Ittarbagh Tea Co. — fictional brand. All products, prices and figures are placeholders. */
export const TEAS = [
  {
    slug: 'damask-darjeeling', name: 'Damask Darjeeling', short: 'Damask', kind: 'Black tea', filter: 'black',
    tagline: 'First-flush Darjeeling, folded with Kannauj rose petals.',
    tin: '#6E0F27', paper: '#2A0710', accent: '#E8A3B4', glow: '#B01E45', photo: 'rose-macro',
    notes: ['Muscatel', 'Fresh rose', 'Honeyed finish'],
    sizes: [['50 g caddy', 360], ['100 g caddy', 640], ['250 g refill', 1450]],
    benefits: [['Whole leaf', 'Hand-rolled first-flush leaf, never broken into fannings.'], ['Real petals', 'Damask rose petals, shade-dried the week they are picked.'], ['Light caffeine', 'Gentle enough for a late-afternoon cup.']],
    desc: 'Our first blend and still the one we drink most. Spring leaf from the Darjeeling hills has a natural grape-skin sweetness; rose petals from the Kannauj distilling fields sit on top of it rather than over it. Drink it plain. Milk hides everything that makes it worth the price.',
    inside: [['First-flush Darjeeling black tea', '92%'], ['Damask rose petals', '8%']],
    brew: [['2.5 g', 'per 200 ml cup'], ['90°C', 'just off the boil'], ['3 min', 'no longer'], ['Plain', 'no milk, no sugar']],
    faqs: [['Is it flavoured with rose oil?', 'No. The only rose in the caddy is dried petals. You can see them.'], ['Can I re-steep it?', 'Once, for four minutes. The second cup is softer and more floral.']]
  },
  {
    slug: 'gulkand-chai', name: 'Gulkand Chai', short: 'Gulkand', kind: 'Masala chai', filter: 'black',
    tagline: 'Strong Assam, cardamom and ginger, sweetened by rose preserve.',
    tin: '#8A4221', paper: '#2B1208', accent: '#F0B98C', glow: '#C0622A', photo: 'chai-kettles',
    notes: ['Malty', 'Green cardamom', 'Rose jam'],
    sizes: [['100 g pouch', 240], ['250 g caddy', 420], ['1 kg café pack', 1480]],
    benefits: [['Built for milk', 'Assam CTC that stands up to a full boil with milk.'], ['Whole spice', 'Cardamom, ginger and clove, crushed the week we pack.'], ['Gulkand, dried', 'Sun-cured rose preserve, so you need less sugar.']],
    desc: 'The chai we make for ourselves at the blending table. Bold Assam CTC for body, whole green cardamom and dried ginger for warmth, and flakes of dried gulkand, the sun-cooked rose preserve, so the cup is gently sweet before you reach for the sugar.',
    inside: [['Assam CTC black tea', '78%'], ['Dried gulkand: rose petals, cane sugar', '10%'], ['Green cardamom', '6%'], ['Dried ginger', '4%'], ['Clove', '2%']],
    brew: [['1 tsp', 'per cup, into water'], ['Boil', '2 minutes'], ['Milk', 'add, boil again'], ['Strain', 'sugar optional']],
    faqs: [['Does it contain sugar?', 'A little, inside the gulkand. Most people find they need half their usual sugar or none.'], ['Is there a café pack?', 'Yes. The 1 kg pack is sized for cafés and offices. Ask about wholesale on the contact page.']]
  },
  {
    slug: 'kahwa-rose', name: 'Kahwa Rose', short: 'Kahwa', kind: 'Green tea', filter: 'green',
    tagline: 'Kashmiri-style kahwa with saffron, almond and rose.',
    tin: '#8C6A1E', paper: '#241A06', accent: '#EBCB7E', glow: '#C79326', photo: 'dried-petals',
    notes: ['Saffron', 'Toasted almond', 'Warm cinnamon'],
    sizes: [['50 g caddy', 420], ['100 g caddy', 720]],
    benefits: [['Real saffron', 'Visible threads in every caddy, not colouring.'], ['Winter warmth', 'Cinnamon and cardamom for cold evenings.'], ['Serve to guests', 'Looks as good in a glass as it tastes.']],
    desc: 'A kahwa the way it is poured after a long winter meal: a light green tea base, a pinch of saffron, cinnamon bark and cardamom, and slivered almonds that you eat from the bottom of the cup. We add rose because a kahwa without it always felt unfinished to us.',
    inside: [['Green tea', '80%'], ['Rose petals', '6%'], ['Slivered almonds', '6%'], ['Cinnamon bark', '4%'], ['Green cardamom', '3%'], ['Saffron', '1%']],
    brew: [['3 g', 'per 200 ml'], ['85°C', 'not boiling'], ['4 min', 'lid on'], ['Honey', 'a little, if you like']],
    faqs: [['Why is it more expensive?', 'Saffron. There is roughly a gram of real Kashmiri saffron in every 100 g caddy.'], ['Can children drink it?', 'It is a green tea, so it contains some caffeine.']]
  },
  {
    slug: 'nilgiri-rose-green', name: 'Nilgiri Rose Green', short: 'Nilgiri', kind: 'Green tea', filter: 'green',
    tagline: 'Bright Nilgiri green tea with rose and lemongrass.',
    tin: '#1D4A33', paper: '#0B1C12', accent: '#A9D4B4', glow: '#2F7A50', photo: 'tea-hills',
    notes: ['Fresh-cut grass', 'Lemongrass', 'Soft rose'],
    sizes: [['50 g caddy', 290], ['100 g caddy', 520]],
    benefits: [['Everyday green', 'Clean and bright, never bitter when brewed right.'], ['Iced or hot', 'Cold-brews overnight into a clear, fragrant jug.'], ['Low caffeine', 'Lighter than our black teas.']],
    desc: 'Green tea from the high Nilgiris is brighter and less grassy than most. We pair it with a little lemongrass to lift it and rose petals to soften it. Brew it cooler than you think, or leave it in the fridge overnight for the best iced tea in the range.',
    inside: [['Nilgiri green tea', '86%'], ['Rose petals', '8%'], ['Lemongrass', '6%']],
    brew: [['2 g', 'per 200 ml'], ['80°C', 'let the kettle rest'], ['2 min', 'short and bright'], ['Cold', 'or 8 hours in the fridge']],
    faqs: [['My green tea tastes bitter. Why?', 'Water that is too hot or a steep that is too long. Try 80°C and two minutes.'], ['How do I make it iced?', '6 g in a litre of cold water, fridge overnight, strain.']]
  },
  {
    slug: 'rose-hibiscus', name: 'Rose Hibiscus', short: 'Hibiscus', kind: 'Caffeine-free', filter: 'free',
    tagline: 'A ruby-red tisane of hibiscus, rose and rosehip.',
    tin: '#5A1036', paper: '#1E0612', accent: '#E9A1C8', glow: '#9C1D5C', photo: 'ruby-tea',
    notes: ['Tart cranberry', 'Rose', 'Cinnamon'],
    sizes: [['50 g caddy', 260], ['100 g caddy', 480]],
    benefits: [['No caffeine', 'No tea leaf at all, so it is fine at midnight.'], ['Deep colour', 'Steeps a clear ruby red in two minutes.'], ['Great iced', 'Add ice, mint and a squeeze of lime.']],
    desc: 'Our only blend without tea leaf. Hibiscus gives the colour and a sharp, cranberry-like tartness; rosehip and rose petals round it off; a little cinnamon keeps it from tasting like juice. It is the one people buy for the whole family.',
    inside: [['Hibiscus', '55%'], ['Rosehip', '20%'], ['Rose petals', '15%'], ['Cinnamon', '6%'], ['Apple pieces', '4%']],
    brew: [['3 g', 'per 250 ml'], ['100°C', 'fully boiling'], ['5 min', 'or longer'], ['Ice', 'for a summer jug']],
    faqs: [['Is it safe in pregnancy?', 'Hibiscus is not recommended during pregnancy. Please check with your doctor first.'], ['Will it stain my cup?', 'It can tint pale ceramic. A rinse straight after drinking prevents it.']]
  }
];
export const BY_SLUG = Object.fromEntries(TEAS.map((t) => [t.slug, t]));
