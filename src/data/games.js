import { grossingGames } from './grossingGames';

export const curatedGames = [
  // RPG
  {
    id: 'rpg1', title: "Baldur's Gate 3", genre: 'rpg', genreLabel: 'RPG', year: 2023,
    platforms: ['PC', 'PS5', 'Xbox Series X'],
    description: "A massive, reactive RPG set in the Forgotten Realms where every choice reshapes the world around you. Thousands of hours of content sprawl across a journey from the Underdark to the city of Baldur's Gate.",
    coverColor: '#7B2D8B',
  },
  {
    id: 'rpg2', title: 'Elden Ring', genre: 'rpg', genreLabel: 'RPG', year: 2022,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X'],
    description: "FromSoftware's open-world action RPG crafted with George R.R. Martin, set in the shattered Lands Between. Brutal boss encounters and cryptic lore reward patience and curiosity in equal measure.",
    coverColor: '#C4601C',
  },
  {
    id: 'rpg3', title: 'Final Fantasy XVI', genre: 'rpg', genreLabel: 'RPG', year: 2023,
    platforms: ['PS5', 'PC'],
    description: "A dark, political fantasy epic that trades turn-based combat for explosive, action-driven Eikon battles. Clive Rosfield's quest for vengeance unfolds across a beautifully realized world of warring nations.",
    coverColor: '#CC1A1A',
  },
  {
    id: 'rpg4', title: 'Disco Elysium', genre: 'rpg', genreLabel: 'RPG', year: 2019,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Switch'],
    description: "A landmark narrative RPG where you play a disgraced detective rebuilding himself through radical ideology and detective work in a post-revolutionary city. Skills argue with each other in your head as you unravel a murder mystery.",
    coverColor: '#3D7AB5',
  },
  {
    id: 'rpg5', title: 'Divinity: Original Sin 2', genre: 'rpg', genreLabel: 'RPG', year: 2017,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "A deeply systemic CRPG that rewards creative problem-solving with fire, water, oil, and air combining into emergent chaos. Every encounter is a puzzle with a dozen solutions, most of them accidental.",
    coverColor: '#8B1A1A',
  },
  {
    id: 'rpg6', title: 'Pathfinder: Wrath of the Righteous', genre: 'rpg', genreLabel: 'RPG', year: 2021,
    platforms: ['PC', 'PS4', 'Xbox One'],
    description: "An ambitious CRPG based on the Pathfinder tabletop system, putting you at the head of a crusade against a demon invasion. Deep character building and mythic powers let you become a legend—or a tyrant.",
    coverColor: '#4A3728',
  },
  {
    id: 'rpg7', title: 'Dragon Age: Origins', genre: 'rpg', genreLabel: 'RPG', year: 2009,
    platforms: ['PC', 'PS3', 'Xbox 360'],
    description: "BioWare's dark fantasy epic weaves six distinct origin stories into a single desperate war against the Blight. Companion relationships and moral choices make every playthrough feel uniquely personal.",
    coverColor: '#6B1F1F',
  },
  {
    id: 'rpg8', title: 'The Witcher 3: Wild Hunt', genre: 'rpg', genreLabel: 'RPG', year: 2015,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Switch'],
    description: "Geralt of Rivia hunts for his adopted daughter across a war-ravaged, morally grey open world. Its side quests are better than most games' main stories, and the writing remains unmatched in the genre.",
    coverColor: '#1A4A2E',
  },
  {
    id: 'rpg9', title: 'Persona 5 Royal', genre: 'rpg', genreLabel: 'RPG', year: 2019,
    platforms: ['PS4', 'PC', 'Xbox One', 'Xbox Series X', 'Switch'],
    description: "Tokyo high schoolers moonlight as Phantom Thieves, raiding the distorted desires of corrupt adults in psychedelic dungeons. A masterclass in style, social sim mechanics, and jazz-infused atmosphere.",
    coverColor: '#CC0000',
  },
  {
    id: 'rpg10', title: 'Octopath Traveler 2', genre: 'rpg', genreLabel: 'RPG', year: 2023,
    platforms: ['PC', 'PS4', 'PS5', 'Switch'],
    description: "Eight travelers with intertwined fates explore a beautifully realized HD-2D world in this refined sequel. The Break and Boost combat system reaches new heights of strategic depth.",
    coverColor: '#2E4A7A',
  },
  {
    id: 'rpg11', title: 'Tyranny', genre: 'rpg', genreLabel: 'RPG', year: 2016,
    platforms: ['PC'],
    description: "A compact, brilliant CRPG where evil has already won and you serve as a magistrate in the dark lord's empire. Your choices shape the conquered world—sometimes the most interesting answer is to become the villain.",
    coverColor: '#5C1A5C',
  },
  {
    id: 'rpg12', title: 'Pillars of Eternity', genre: 'rpg', genreLabel: 'RPG', year: 2015,
    platforms: ['PC', 'PS4', 'Xbox One'],
    description: "Obsidian's spiritual successor to Baldur's Gate channels classic IE-engine RPGs with a fresh metaphysical twist on souls. Dense lore, tactical combat, and a world haunted by children born without souls.",
    coverColor: '#3A2E1A',
  },
  {
    id: 'rpg13', title: 'Fire Emblem Engage', genre: 'rpg', genreLabel: 'RPG', year: 2023,
    platforms: ['Switch'],
    description: "Nintendo's tactical RPG celebrates the series' history by letting heroes summon and merge with legendary characters from past games. The engaging system breathes fresh mechanical life into classic Fire Emblem strategy.",
    coverColor: '#1A3A7A',
  },
  {
    id: 'rpg14', title: 'Xenoblade Chronicles 3', genre: 'rpg', genreLabel: 'RPG', year: 2022,
    platforms: ['Switch'],
    description: "Two warring nations discover their eternal conflict is a lie in this sweeping JRPG about life, death, and the meaning of both. The interconnected class system and massive open regions give hundreds of hours of content.",
    coverColor: '#1A6B5C',
  },
  {
    id: 'rpg15', title: 'Wasteland 3', genre: 'rpg', genreLabel: 'RPG', year: 2020,
    platforms: ['PC', 'PS4', 'Xbox One'],
    description: "Desert Rangers travel to frozen post-apocalyptic Colorado in this irreverent and surprisingly touching squad RPG. Darkly humorous writing pairs with deep tactical combat and meaningful faction choices.",
    coverColor: '#4A6B1A',
  },

  // FPS
  {
    id: 'fps1', title: 'Halo Infinite', genre: 'fps', genreLabel: 'FPS', year: 2021,
    platforms: ['Xbox One', 'Xbox Series X', 'PC'],
    description: "Master Chief returns to a semi-open Zeta Halo in the most confident Halo campaign in years. The grappleshot transforms traversal and combat, while a revamped multiplayer finds its footing.",
    coverColor: '#1A7ABA',
  },
  {
    id: 'fps2', title: 'DOOM Eternal', genre: 'fps', genreLabel: 'FPS', year: 2020,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Switch'],
    description: "Id Software's relentless sequel cranks every dial to eleven with a combat system demanding constant aggression to survive. Chainsaw for ammo, flame belch for armor—it's a perpetual motion machine of ultra-violence.",
    coverColor: '#CC3300',
  },
  {
    id: 'fps3', title: 'Titanfall 2', genre: 'fps', genreLabel: 'FPS', year: 2016,
    platforms: ['PC', 'PS4', 'Xbox One'],
    description: "One of the finest single-player FPS campaigns ever made, hidden inside a multiplayer shooter. Wall-running, time-manipulation, and the bond between pilot and titan make it impossible to put down.",
    coverColor: '#FF6B00',
  },
  {
    id: 'fps4', title: 'Outer Wilds', genre: 'fps', genreLabel: 'FPS', year: 2019,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "A time-loop mystery set in a hand-crafted solar system where knowledge—not gear—is your progression. One of the most profound games ever made about curiosity, impermanence, and wonder.",
    coverColor: '#FF9B1A',
  },
  {
    id: 'fps5', title: 'BioShock Infinite', genre: 'fps', genreLabel: 'FPS', year: 2013,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "Booker DeWitt arrives in the floating city of Columbia to rescue a mysterious woman named Elizabeth. The sky-city setting dazzles, and the story's quantum narrative ambition rewards multiple playthroughs.",
    coverColor: '#1A4A8B',
  },
  {
    id: 'fps6', title: 'Superhot', genre: 'fps', genreLabel: 'FPS', year: 2016,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "Time moves only when you move in this minimalist action game that makes you feel like a bullet-dodging action hero. Short but utterly singular—every level is a puzzle and a power fantasy.",
    coverColor: '#E81A1A',
  },
  {
    id: 'fps7', title: 'Deep Rock Galactic', genre: 'fps', genreLabel: 'FPS', year: 2020,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X'],
    description: "Four space dwarves mine, fight, and drink their way through procedurally generated alien caves in this co-op treasure. Rock and Stone isn't just a catchphrase—it's a philosophy.",
    coverColor: '#F5A623',
  },
  {
    id: 'fps8', title: 'Splitgate', genre: 'fps', genreLabel: 'FPS', year: 2021,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X'],
    description: "Portal meets arena shooter in this free-to-play multiplayer that turns every match into a chaotic spatial puzzle. Placing portals mid-fight adds a mind-bending layer to classic competitive FPS.",
    coverColor: '#00BFFF',
  },
  {
    id: 'fps9', title: 'Amid Evil', genre: 'fps', genreLabel: 'FPS', year: 2019,
    platforms: ['PC'],
    description: "A retro FPS dripping with dark fantasy atmosphere and satisfying chunky weapons. Each episode takes you through a radically different dimension with unique enemies and jaw-dropping art direction.",
    coverColor: '#7B1FA2',
  },
  {
    id: 'fps10', title: 'ULTRAKILL', genre: 'fps', genreLabel: 'FPS', year: 2020,
    platforms: ['PC'],
    description: "A machine that runs on blood descends into Hell in this ultra-fast stylish action FPS inspired by Quake and Devil May Cry. Style ranks, parrying bullets, and coin tricks make every fight a performance.",
    coverColor: '#B71C1C',
  },
  {
    id: 'fps11', title: 'Prodeus', genre: 'fps', genreLabel: 'FPS', year: 2022,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Switch'],
    description: "A boomer shooter that wraps classic Doom-era gameplay in a slick modern renderer with beautiful lighting. Gore, speed, and secrets around every corner make it one of the best retro revivals.",
    coverColor: '#BF360C',
  },
  {
    id: 'fps12', title: 'Turbo Overkill', genre: 'fps', genreLabel: 'FPS', year: 2023,
    platforms: ['PC'],
    description: "Johnny Turbo slides through a cyberpunk city on his chainsaw leg mowing down cyborg criminals in this neon-soaked shooter. Audaciously fast and stylish with level design that rewards aggressive movement.",
    coverColor: '#00BCD4',
  },
  {
    id: 'fps13', title: 'Ghostrunner', genre: 'fps', genreLabel: 'FPS', year: 2020,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Switch'],
    description: "A one-hit-kill cyber-ninja parkour game set in a dystopian megacity tower. Die, retry, and feel increasingly godlike as you chain wall-runs, dashes, and katana kills into perfect sequences.",
    coverColor: '#00E5FF',
  },
  {
    id: 'fps14', title: 'Severed Steel', genre: 'fps', genreLabel: 'FPS', year: 2021,
    platforms: ['PC', 'PS4', 'Xbox One'],
    description: "A one-armed gunslinger dives through fully destructible environments in ballet of bullets and chaos. The slow-motion mechanics and procedurally deformable arenas make every run feel cinematic.",
    coverColor: '#880E4F',
  },
  {
    id: 'fps15', title: 'Trepang2', genre: 'fps', genreLabel: 'FPS', year: 2023,
    platforms: ['PC'],
    description: "A love letter to F.E.A.R. that puts superhuman abilities and satisfying gunplay in a mysterious conspiracy thriller. Slowing time to dodge bullets while shotgunning a room full of soldiers never stops feeling incredible.",
    coverColor: '#1B5E20',
  },

  // Cozy
  {
    id: 'cozy1', title: 'Stardew Valley', genre: 'cozy', genreLabel: 'Cozy', year: 2016,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch', 'Mobile'],
    description: "A love letter to Harvest Moon where you inherit your grandfather's farm and carve out a peaceful rural life. Mining, fishing, farming, and forging friendships creates an endlessly cozy loop.",
    coverColor: '#7CB342',
  },
  {
    id: 'cozy2', title: 'Animal Crossing: New Horizons', genre: 'cozy', genreLabel: 'Cozy', year: 2020,
    platforms: ['Switch'],
    description: "You arrive on a deserted island and slowly build it into a thriving community at your own pace. Real-time seasons, daily events, and thousands of customization options make it endlessly personal.",
    coverColor: '#80CBC4',
  },
  {
    id: 'cozy3', title: 'Unpacking', genre: 'cozy', genreLabel: 'Cozy', year: 2021,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Switch'],
    description: "A zen puzzle game about unpacking boxes into a new home at different stages of a life. The narrative told entirely through objects is unexpectedly moving and deeply clever.",
    coverColor: '#F06292',
  },
  {
    id: 'cozy4', title: 'A Short Hike', genre: 'cozy', genreLabel: 'Cozy', year: 2019,
    platforms: ['PC', 'Switch'],
    description: "A tiny open-world adventure on a mountain island where Claire hikes toward a cell signal. Charming, warm, and perfectly sized—it takes two hours and stays with you forever.",
    coverColor: '#4FC3F7',
  },
  {
    id: 'cozy5', title: 'Spiritfarer', genre: 'cozy', genreLabel: 'Cozy', year: 2020,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "You ferry the dead to the afterlife in this gorgeous management game about grief, care, and letting go. Each spirit has a full story arc that will quietly break your heart before releasing it.",
    coverColor: '#FF7043',
  },
  {
    id: 'cozy6', title: 'Cozy Grove', genre: 'cozy', genreLabel: 'Cozy', year: 2021,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch', 'Mobile'],
    description: "A camp caretaker befriends bear-ghost spirits on a haunted island in this real-time life sim. Designed for 30 minutes a day, it rewards patient players with gorgeous watercolor art and heartfelt stories.",
    coverColor: '#CE93D8',
  },
  {
    id: 'cozy7', title: 'Alba: A Wildlife Adventure', genre: 'cozy', genreLabel: 'Cozy', year: 2020,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch', 'Mobile'],
    description: "A young girl spends summer with her grandparents and rallies her town to save a nature reserve. Bird-watching with your phone camera is unexpectedly delightful in this warm environmental adventure.",
    coverColor: '#66BB6A',
  },
  {
    id: 'cozy8', title: 'Eastshade', genre: 'cozy', genreLabel: 'Cozy', year: 2019,
    platforms: ['PC', 'PS4', 'Xbox One'],
    description: "A traveling painter explores a beautiful open world, completing quests by painting the environment. A genuinely nonviolent RPG where art, conversation, and curiosity are your only tools.",
    coverColor: '#A5D6A7',
  },
  {
    id: 'cozy9', title: 'Garden Story', genre: 'cozy', genreLabel: 'Cozy', year: 2021,
    platforms: ['PC', 'Switch'],
    description: "A young grape named Concord becomes the protector of a rotting island community in this cozy action-RPG. Resource gathering, town restoration, and gentle friendship mechanics create a warm loop.",
    coverColor: '#AED581',
  },
  {
    id: 'cozy10', title: 'Tavern Talk', genre: 'cozy', genreLabel: 'Cozy', year: 2024,
    platforms: ['PC'],
    description: "You run a fantasy tavern and chat with adventurers passing through, mixing drinks and hearing their tales. A visual novel crossed with a bartending sim, warm, witty, and full of delightful characters.",
    coverColor: '#FFCA28',
  },
  {
    id: 'cozy11', title: 'Dorfromantik', genre: 'cozy', genreLabel: 'Cozy', year: 2022,
    platforms: ['PC', 'Switch'],
    description: "A meditative tile-placing puzzle game where you build a peaceful countryside one hex at a time. Matching terrain to unlock more tiles creates a satisfying, endlessly chill loop with beautiful results.",
    coverColor: '#80DEEA',
  },
  {
    id: 'cozy12', title: 'Tiny Glade', genre: 'cozy', genreLabel: 'Cozy', year: 2024,
    platforms: ['PC'],
    description: "A freeform diorama-builder where you sculpt cozy castles and gardens with no pressure or failure states. Walls, paths, and water flow together procedurally to create storybook scenes.",
    coverColor: '#FFB74D',
  },
  {
    id: 'cozy13', title: "Mineko's Night Market", genre: 'cozy', genreLabel: 'Cozy', year: 2023,
    platforms: ['PC', 'Switch'],
    description: "A cat-themed life sim set in a charming Japanese-inspired village where you craft and sell at weekly night markets. Festival events, quirky NPCs, and adorable cat mysteries fill each in-game month.",
    coverColor: '#F48FB1',
  },
  {
    id: 'cozy14', title: 'Ooblets', genre: 'cozy', genreLabel: 'Cozy', year: 2020,
    platforms: ['PC', 'Xbox One', 'Switch'],
    description: "A farm and creature-collection game where battles are settled through dance-offs rather than combat. Relentlessly wholesome, funny, and full of personality in every corner of its weird little world.",
    coverColor: '#B39DDB',
  },
  {
    id: 'cozy15', title: 'Fae Farm', genre: 'cozy', genreLabel: 'Cozy', year: 2023,
    platforms: ['PC', 'Switch'],
    description: "A magical farming sim set on a fae island full of elemental creatures and enchanted mysteries to solve. Cozy couch co-op support and bright pastel visuals make it ideal for playing with a partner.",
    coverColor: '#81D4FA',
  },

  // Co-op
  {
    id: 'coop1', title: 'It Takes Two', genre: 'coop', genreLabel: 'Co-op', year: 2021,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Switch'],
    description: "Two divorcing parents shrunk into dolls must work together through a wild genre-hopping adventure. Every chapter introduces a completely new mechanic, and the co-op design is genuinely unmatched.",
    coverColor: '#E91E63',
  },
  {
    id: 'coop2', title: 'Overcooked! 2', genre: 'coop', genreLabel: 'Co-op', year: 2018,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "A chaotic kitchen co-op that tests communication and coordination under ridiculous pressure. Recipes escalate from manageable to absurd as you cook on moving trucks, magic carpets, and worse.",
    coverColor: '#FF5722',
  },
  {
    id: 'coop3', title: 'Lovers in a Dangerous Spacetime', genre: 'coop', genreLabel: 'Co-op', year: 2015,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "Crew a neon battleship through colorful space fighting anti-love forces in this gorgeous co-op shooter. Managing different ship stations together creates an organic, chaotic teamwork dynamic.",
    coverColor: '#9C27B0',
  },
  {
    id: 'coop4', title: 'A Way Out', genre: 'coop', genreLabel: 'Co-op', year: 2018,
    platforms: ['PC', 'PS4', 'Xbox One'],
    description: "Two prison inmates must break out together and stay ahead of the law in this co-op-only cinematic adventure. Genre-shifting set pieces and a gut-punch ending make it an unforgettable co-op experience.",
    coverColor: '#607D8B',
  },
  {
    id: 'coop5', title: 'Unravel Two', genre: 'coop', genreLabel: 'Co-op', year: 2018,
    platforms: ['PC', 'PS4', 'Xbox One'],
    description: "Two yarn Yarnys linked by a thread navigate puzzles and platforming in this gorgeous co-op sequel. The connecting thread mechanic—swinging, pulling, saving each other—is a perfect co-op metaphor.",
    coverColor: '#F44336',
  },
  {
    id: 'coop6', title: 'Portal 2', genre: 'coop', genreLabel: 'Co-op', year: 2011,
    platforms: ['PC', 'PS3', 'Xbox 360'],
    description: "Valve's genre-defining puzzle sequel features a full co-op campaign that demands spatial reasoning and trust. GLaDOS's taunting and the growing complexity of portal puzzles make this a perennial co-op favorite.",
    coverColor: '#FF6D00',
  },
  {
    id: 'coop7', title: 'Divinity: Original Sin 2', genre: 'coop', genreLabel: 'Co-op', year: 2017,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "Play the full campaign co-op with up to four friends, each controlling their own origin character with conflicting goals. Arguments over loot, elemental combo accidents, and shared triumphs create unforgettable moments.",
    coverColor: '#9B2226',
  },
  {
    id: 'coop8', title: 'Deep Rock Galactic', genre: 'coop', genreLabel: 'Co-op', year: 2020,
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X'],
    description: "Four space dwarves descend into procedurally generated alien caves to mine and fight in this beloved co-op FPS. The community is legendary for its warmth, and every class synergizes in meaningful ways.",
    coverColor: '#E65100',
  },
  {
    id: 'coop9', title: 'Valheim', genre: 'coop', genreLabel: 'Co-op', year: 2021,
    platforms: ['PC', 'Xbox One', 'Xbox Series X'],
    description: "Viking spirits build, explore, and conquer a procedurally generated Norse purgatory together. The survival crafting loop is compelling solo but extraordinary with friends who divvy up tasks naturally.",
    coverColor: '#37474F',
  },
  {
    id: 'coop10', title: 'Phasmophobia', genre: 'coop', genreLabel: 'Co-op', year: 2020,
    platforms: ['PC'],
    description: "Ghost hunters collect paranormal evidence in increasingly terrifying haunted locations while ghosts learn their names. Voice recognition means your scared screaming makes things worse—by design.",
    coverColor: '#1A237E',
  },
  {
    id: 'coop11', title: 'Keep Talking and Nobody Explodes', genre: 'coop', genreLabel: 'Co-op', year: 2015,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch', 'Mobile'],
    description: "One player defuses a bomb while others read the manual—and no one can see each other's screens. A communication exercise disguised as a party game that produces genuine panic and laughter in equal measure.",
    coverColor: '#F9A825',
  },
  {
    id: 'coop12', title: 'Trine 4: The Nightmare Prince', genre: 'coop', genreLabel: 'Co-op', year: 2019,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "Three heroes combine their physics-based abilities to navigate fairy-tale puzzles in stunning visual splendor. The co-op sandbox lets you solve puzzles in creative, chaotic, and beautiful ways.",
    coverColor: '#1565C0',
  },
  {
    id: 'coop13', title: 'Moving Out', genre: 'coop', genreLabel: 'Co-op', year: 2020,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "Certified (not really) furniture movers fling sofas through windows in this gleefully destructive physics co-op. Assisted mode options and escalating chaos make it one of the most accessible party games around.",
    coverColor: '#FF8F00',
  },
  {
    id: 'coop14', title: 'Phogs!', genre: 'coop', genreLabel: 'Co-op', year: 2020,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "Two heads on one dog body navigate puzzles in a cheerful world of food, sleep, and play themed worlds. The shared body mechanic forces constant coordination and creates wonderfully silly moments.",
    coverColor: '#00897B',
  },
  {
    id: 'coop15', title: 'Degrees of Separation', genre: 'coop', genreLabel: 'Co-op', year: 2019,
    platforms: ['PC', 'PS4', 'Xbox One', 'Switch'],
    description: "Two characters of opposing temperatures—one warm, one cold—must manipulate the environment together to progress. A narrative puzzle game about finding connection across difference, narrated by Doug Cockle.",
    coverColor: '#6A1B9A',
  },
];

// Merge grossing games, skipping any whose title already exists in the curated set
const curatedTitles = new Set(curatedGames.map(g => g.title.toLowerCase()));
const uniqueGrossingGames = grossingGames.filter(
  g => !curatedTitles.has(g.title.toLowerCase())
);

// Full games array — used for search, game pages, and top-10 pickers
export const games = [...curatedGames, ...uniqueGrossingGames];

// Only curated games per genre — used for genre sections on home and genre-favorites picker
export const gamesByGenre = {
  rpg: curatedGames.filter(g => g.genre === 'rpg'),
  fps: curatedGames.filter(g => g.genre === 'fps'),
  cozy: curatedGames.filter(g => g.genre === 'cozy'),
  coop: curatedGames.filter(g => g.genre === 'coop'),
};

export const genreSections = [
  { key: 'rpg', label: 'RPG' },
  { key: 'fps', label: 'FPS' },
  { key: 'cozy', label: 'Cozy' },
  { key: 'coop', label: 'Co-op' },
];

export function getGameById(id) {
  return games.find(g => g.id === id);
}
