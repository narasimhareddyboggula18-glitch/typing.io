export interface Level {
  id: number;
  name: string;
  tier: 'basic' | 'intermediate' | 'upper' | 'expert';
  minWpm: number;
  minAccuracy: number;
  xpReward: number;
  words: string[];
}

const BASIC: string[] = [
  'the','and','for','are','but','not','you','all','can','her','was','one','our','out','day',
  'get','has','him','his','how','its','may','new','now','old','see','two','way','who','boy',
  'did','let','man','put','say','she','too','use','cat','dog','run','sit','top','fun','big',
  'cup','sun','hat','red','bed','hot','pot','cut','bus','box','map','bag','pan','ten','six',
  'key','fly','try','buy','dry','cry','fry','sky','spy','why','eye','tie','die','lie','pie',
  'ask','bit','dam','ear','fan','gap','ice','job','kid','lap','mix','nap','oak','pad','raw',
  'sad','tab','urn','van','wax','yak','zip','ace','bat','cab','den','egg','fog','gin',
];

const INTERMEDIATE_WORDS: string[] = [
  'about','above','after','again','along','asked','began','being','below','bring',
  'build','carry','cause','check','comes','could','doing','earth','every','falls',
  'found','given','going','great','group','hands','heard','house','human','ideas',
  'important','inside','known','large','later','learn','light','lines','lived','local',
  'makes','might','money','month','moved','music','names','night','north','noted',
  'often','order','other','parts','place','plant','point','power','print','quite',
  'reach','ready','right','river','rooms','round','short','shown','since','small',
  'sound','south','space','speak','stand','start','state','still','story','study',
  'taken','there','thing','think','those','three','threw','today','together','tried',
  'under','until','using','value','voice','water','where','which','while','world','write',
];

const SENTENCES_INTERMEDIATE: string[] = [
  'the quick brown fox jumps over the lazy dog',
  'practice makes perfect when you type every day',
  'a journey of a thousand miles begins with a single step',
  'the early bird catches the worm but the second mouse gets the cheese',
  'type fast and accurately to become a true typing master',
  'every keystroke brings you closer to your goal of speed',
  'focus on accuracy first and speed will naturally follow you',
  'the best typists practice for at least thirty minutes daily',
  'your fingers should rest on the home row keys always',
  'learning to type without looking takes time and dedication',
  'great things never came from comfort zones so keep pushing',
  'consistency is the key to improvement in typing and life',
];

const HARD_WORDS: string[] = [
  'absolutely','accommodate','achievement','acknowledge','acquisition','administration',
  'approximately','architecture','assassination','atmosphere','authentication','bureaucracy',
  'catastrophic','circumstances','collaboration','commemorate','communication','complicated',
  'concentration','conscientious','consequences','controversial','corporation','corresponding',
  'deterioration','determination','disappointment','discrepancy','documentation','establishment',
  'exaggeration','explanation','extraordinary','fluctuation','fundamentally','hallucination',
  'hypothetically','identification','illustration','immediately','implementation','independently',
  'infrastructure','initialization','intelligence','interpretation','investigation','kaleidoscope',
  'legitimately','manipulation','manufacturing','miscellaneous','misunderstanding','modernization',
  'multiplication','negotiation','nevertheless','occasionally','opportunities','organization',
  'overwhelming','parliamentary','particularly','perpendicular','philosophical','precipitation',
  'predominantly','prioritization','pronunciation','psychological','questionnaire','rehabilitation',
  'relationships','representation','responsibility','revolutionary','simultaneously','sophisticated',
  'specifications','straightforward','subconscious','subsequently','supplementary','telecommunication',
  'transformation','transparency','unfortunately','unprecedented','vulnerability','Mediterranean',
];

const HARD_SENTENCES: string[] = [
  'The cryptocurrency market experienced unprecedented volatility, leaving investors questioning their portfolio allocations.',
  'Artificial intelligence algorithms are fundamentally transforming how organizations approach problem-solving methodologies.',
  'The extraordinarily complicated bureaucratic procedures created overwhelming obstacles for the ambitious entrepreneurs.',
  'Electromagnetic interference from sophisticated equipment significantly disrupted telecommunications infrastructure systems.',
  'Philosophical investigations into consciousness reveal the extraordinary complexity of subjective human experience.',
  'The psychological consequences of prolonged isolation substantially compromise neurological functioning and emotional resilience.',
  'Contemporary architectural innovations increasingly incorporate sustainable materials and environmentally responsible construction methodologies.',
  'Cybersecurity vulnerabilities in interconnected infrastructure represent extraordinarily serious threats to national sovereignty.',
  'The revolutionary pharmaceutical breakthrough demonstrated unprecedented efficacy in treating previously untreatable neurological disorders.',
  'Geopolitical transformations throughout the Mediterranean region have profoundly influenced global economic relationships and trajectories.',
];

const EXPERT_WORDS: string[] = [
  'antidisestablishmentarianism','counterrevolutionary','deoxyribonucleic','electroencephalography',
  'gastroenterologist','hexadecimal','immunosuppressant','jurisdictional','kaleidoscopically',
  'lexicographical','microprocessor','neurotransmitter','ophthalmologist','pharmacokinetics',
  'pseudorandomness','quadrilateral','rhinoplasty','socioeconomic','thermoregulation',
  'ultrasonography','vasodilatory','wavelength','xenotransplantation','zygomaticus',
  'algorithm','asynchronous','authentication','bandwidth','blockchain','boolean','callback',
  'cryptography','datastructure','dependency','encapsulation','fibonacci','framework',
  'garbage','heuristic','idempotent','javascript','kubernetes','latency','middleware',
  'namespace','orchestration','polymorphism','recursion','serialization','throughput',
  'typescript','ubiquitous','virtualization','webhook','xenomorphic','yielding','zeroconf',
];

const EXPERT_SENTENCES: string[] = [
  'const fibonacci = (n: number): number => n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);',
  'SELECT users.*, COUNT(orders.id) FROM users LEFT JOIN orders ON users.id = orders.user_id GROUP BY users.id;',
  'The neurotransmitter dopaminergic pathways modulate reward-motivated behavior through complex electrochemical signal transduction.',
  'Quantum entanglement demonstrates nonlocal correlations that fundamentally challenge classical deterministic worldviews.',
  'async function fetchData(url: string): Promise<Response> { return await fetch(url, { method: "GET" }); }',
  'The cryptographic hash function SHA-256 produces a 256-bit signature for arbitrary-length input data streams.',
  'kubectl apply -f deployment.yaml && kubectl rollout status deployment/typeforge --timeout=300s',
  'Photosynthetic organisms convert electromagnetic radiation at wavelengths 400-700nm into chemical energy via chlorophyll.',
  'The distributed consensus algorithm achieves Byzantine fault tolerance across geographically dispersed heterogeneous nodes.',
  'git commit -m "feat: implement WebSocket real-time synchronization with exponential backoff reconnection strategy"',
  'Immunohistochemical analysis revealed significant upregulation of proinflammatory cytokines in the perilesional cortical tissue.',
  'The microservices architecture employs containerization via Docker with Kubernetes orchestration for horizontal scalability.',
];

function buildWordPool(words: string[], count: number = 80): string[] {
  const pool: string[] = [];
  while (pool.length < count) {
    pool.push(...words);
  }
  return pool.slice(0, count);
}

function buildSentencePool(sentences: string[], words: string[], count: number = 60): string[] {
  const pool: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i % 3 === 0) pool.push(sentences[i % sentences.length]);
    else pool.push(words[i % words.length]);
  }
  return pool;
}

export const LEVELS: Level[] = [
  // BASIC L1-20
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `Basic ${i + 1}`,
    tier: 'basic' as const,
    minWpm: 15 + i,
    minAccuracy: 85 + Math.floor(i / 4),
    xpReward: 50 + i * 10,
    words: buildWordPool(BASIC.slice(i * 3, i * 3 + 40).concat(BASIC.slice(0, 20))),
  })),
  // INTERMEDIATE L21-40
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 21,
    name: `Intermediate ${i + 1}`,
    tier: 'intermediate' as const,
    minWpm: 35 + i * 2,
    minAccuracy: 88 + Math.floor(i / 5),
    xpReward: 100 + i * 15,
    words: buildWordPool(INTERMEDIATE_WORDS.concat(SENTENCES_INTERMEDIATE[i % SENTENCES_INTERMEDIATE.length].split(' '))),
  })),
  // UPPER/HARD L41-70
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 41,
    name: `Hard ${i + 1}`,
    tier: 'upper' as const,
    minWpm: 50 + i * 2,
    minAccuracy: 90 + Math.floor(i / 10),
    xpReward: 200 + i * 20,
    words: buildSentencePool(HARD_SENTENCES, HARD_WORDS),
  })),
  // EXPERT L71-100
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 71,
    name: `Expert ${i + 1}`,
    tier: 'expert' as const,
    minWpm: 80 + i * 2,
    minAccuracy: 93 + Math.floor(i / 15),
    xpReward: 400 + i * 30,
    words: buildSentencePool(EXPERT_SENTENCES, EXPERT_WORDS),
  })),
];

export function getLevelText(level: Level): string {
  const pool = level.words;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(80, shuffled.length)).join(' ');
}

export function getStars(wpm: number, accuracy: number, level: Level): number {
  if (accuracy < level.minAccuracy || wpm < level.minWpm) return 0;
  if (wpm >= level.minWpm * 1.5 && accuracy >= 97) return 3;
  if (wpm >= level.minWpm * 1.2 && accuracy >= 93) return 2;
  return 1;
}

export const TIER_COLORS = {
  basic: '#00f5ff',
  intermediate: '#00ff88',
  upper: '#ff8c00',
  expert: '#ff3d6b',
};

export const TIER_LABELS = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  upper: 'Hard',
  expert: 'Expert',
};
