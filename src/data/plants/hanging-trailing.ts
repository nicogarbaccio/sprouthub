import { Plant } from '../types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

export const hangingTrailingPlants: Plant[] = [
  {
    name: 'Pothos',
    botanicalName: 'Epipremnum aureum',
    otherNames: ['Devil\'s Ivy', 'Golden Pothos', 'Hunter\'s Robe', 'Money Plant'],
    image: PLANT_IMAGES_BASE_URL + '/Pothos.png',
    wateringFrequency: 'Weekly',
    suggestedWateringDays: 7,
    lightRequirement: 'Low to Medium Light',
    careLevel: 'Easy' as const,
    category: 'Hanging & Trailing Plants',
    description: 'Often called the most indestructible houseplant, Pothos is native to the Solomon Islands and has become the ultimate beginner plant thanks to its incredible adaptability and forgiving nature. This vigorous trailing vine features heart-shaped leaves splashed with yellow or white variegation (or solid green in some varieties) that cascade gracefully from hanging baskets or climb up moss poles with aerial roots. The vines can grow 20-40 feet long in ideal conditions, though most indoor plants are kept trimmed to 6-10 feet. Pothos earned its nickname "Devil\'s Ivy" because it\'s nearly impossible to kill and stays green even in near darkness. It\'s also a powerful air purifier, removing toxins like formaldehyde and benzene from indoor air, making it both beautiful and functional.',
    toxicity: 'Toxic to pets and humans if ingested - contains calcium oxalate crystals',
    temperature: '60-85°F (15-29°C) - extremely temperature tolerant',
    humidity: '30-50% (tolerates dry air)',
    careInstructions: [
      'Water when top 1-2 inches of soil are dry - typically weekly',
      'Thrives in low to bright indirect light - one of the most adaptable plants',
      'Can survive in fluorescent office lighting with minimal natural light',
      'Prune regularly to maintain desired length and encourage fuller growth',
      'Propagates incredibly easily in water - just cut below a node',
      'Wipe leaves monthly to remove dust and enhance variegation',
      'Fertilize monthly during growing season with diluted balanced fertilizer',
      'Rotate plant occasionally if growing toward light source'
    ],
    commonProblems: [
      'Yellow leaves: Usually overwatering - allow soil to dry more between waterings',
      'Brown leaf tips: Fluoride or chlorine sensitivity - use filtered water',
      'Loss of variegation: Insufficient light - move to brighter location',
      'Leggy growth with sparse leaves: Not enough light - provide brighter conditions',
      'Root rot: Overwatering or poor drainage - ensure pot has drainage holes',
      'Pests (rare): Occasionally spider mites or mealybugs - treat promptly'
    ]
  },
  {
    name: 'Spider Plant',
    botanicalName: 'Chlorophytum comosum',
    otherNames: ['Airplane Plant', 'Ribbon Plant', 'Spider Ivy', 'St. Bernard\'s Lily'],
    image: PLANT_IMAGES_BASE_URL + '/Spider%20Plant.jpg',
    wateringFrequency: 'Weekly',
    suggestedWateringDays: 7,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Easy' as const,
    category: 'Hanging & Trailing Plants',
    description: 'Native to coastal South Africa, Spider Plant is a classic houseplant that has graced homes since Victorian times thanks to its graceful arching foliage and fascinating reproductive habit. The plant forms fountain-like rosettes of long, slender leaves striped with white or cream, and as it matures, it sends out long stems (stolons) that dangle like spiders on silk threads, producing miniature plantlets (babies or "spiderettes") at the ends. These babies can be rooted easily, making spider plants one of the most shareable houseplants. Highly effective at purifying air and removing pollutants, it\'s also incredibly forgiving and adaptable. The combination of attractive variegated foliage, easy propagation, and air-cleaning abilities makes it perfect for beginners and a staple in plant collections.',
    toxicity: 'Non-toxic to pets and humans (though cats may be attracted to the leaves)',
    temperature: '60-80°F (15-27°C)',
    humidity: '40-60%',
    careInstructions: [
      'Water when top inch of soil is dry - prefers consistently moist soil',
      'Provide bright, indirect light for best growth and variegation',
      'Use filtered or distilled water if possible - sensitive to fluoride',
      'Fertilize monthly during growing season with diluted balanced fertilizer',
      'Remove brown tips with clean scissors if they develop',
      'Propagate by planting or rooting the baby plantlets in water or soil',
      'Repot when roots become very crowded - they like being slightly pot-bound',
      'Trim off baby plantlets if you want fuller mother plant'
    ],
    commonProblems: [
      'Brown leaf tips: Fluoride, chlorine, or salts in tap water - use filtered water',
      'Yellowing leaves: Overwatering or waterlogged soil - improve drainage',
      'Pale leaves: Too much direct sun or nutrient deficiency',
      'No baby plantlets: Plant too young or insufficient light',
      'Root rot: Overwatering - allow top inch to dry between waterings',
      'Drooping leaves: Underwatering - increase watering frequency'
    ]
  },
  {
    name: 'English Ivy',
    botanicalName: 'Hedera helix',
    otherNames: ['Common Ivy', 'European Ivy', 'Sweetheart Ivy'],
    image: PLANT_IMAGES_BASE_URL + '/English%20Ivy.jpg',
    wateringFrequency: 'Twice weekly',
    suggestedWateringDays: 3,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Medium' as const,
    category: 'Hanging & Trailing Plants',
    description: 'A timeless classic from Europe, North Africa, and Western Asia, English Ivy has adorned buildings and homes for centuries with its elegant, lobed leaves that come in various sizes and variegation patterns from deep green to cream and white. This versatile plant can trail gracefully from hanging baskets, climb up trellises with clinging aerial roots, or be trained into topiary shapes. The vines can grow several feet long indoors, creating lush, sophisticated displays. While beautiful, English Ivy is more demanding than other trailing plants, requiring cooler temperatures, higher humidity, and vigilant pest management. When its needs are met, it rewards with dense, classical beauty and excellent air-purifying qualities, particularly effective at removing airborne mold spores.',
    toxicity: 'Toxic to pets and humans if ingested - can cause vomiting and diarrhea',
    temperature: '50-70°F (10-21°C) - prefers cool conditions',
    humidity: '50-70% - higher humidity is critical',
    careInstructions: [
      'Water when top inch of soil feels dry - prefers consistently moist soil',
      'Provide bright, indirect light - tolerates some shade',
      'Maintain high humidity with regular misting or pebble tray',
      'Keep in cooler rooms away from heating vents',
      'Pinch growing tips regularly to encourage bushier, fuller growth',
      'Clean leaves regularly to remove dust and check for pests',
      'Fertilize monthly during growing season with diluted balanced fertilizer',
      'Shower plant monthly to rinse leaves and prevent spider mites'
    ],
    commonProblems: [
      'Spider mites: Most common problem - increase humidity, mist daily, treat promptly',
      'Yellowing leaves: Overwatering or poor drainage',
      'Leggy, sparse growth: Insufficient light or needs regular pinching',
      'Brown, crispy leaf tips: Low humidity or fluoride in water',
      'Leaf drop: Temperature fluctuations, drafts, or too warm',
      'Powdery mildew: Poor air circulation - improve ventilation'
    ]
  },
  {
    name: 'String of Hearts',
    botanicalName: 'Ceropegia woodii',
    otherNames: ['Rosary Vine', 'Chain of Hearts', 'Hearts-on-a-String', 'Sweetheart Vine'],
    image: PLANT_IMAGES_BASE_URL + '/String%20of%20Hearts.jpg',
    wateringFrequency: 'Every 10-14 days',
    suggestedWateringDays: 14,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Easy' as const,
    category: 'Hanging & Trailing Plants',
    description: 'A delicate succulent vine native to South Africa, String of Hearts produces cascading strands adorned with pairs of tiny heart-shaped leaves in dusty blue-green with silver variegation and purple undersides - like a romantic garland of valentine hearts. The thin, purple stems can trail 6-12 feet long, creating an ethereal, romantic display perfect for hanging baskets or shelves. The plant develops small tubers along the vines and at the base that store water, making it remarkably drought-tolerant. In proper conditions, it produces small, tubular purple flowers that add to its charm. Fast-growing and easy to propagate, it can quickly fill a hanging basket with its delicate trailing foliage that seems to float on air.',
    toxicity: 'Non-toxic to pets and humans',
    temperature: '60-80°F (15-27°C)',
    humidity: '30-50% - tolerates dry air',
    careInstructions: [
      'Water thoroughly only when soil is completely dry - every 10-14 days',
      'Use well-draining succulent or cactus potting mix',
      'Provide bright, indirect light for best color and compact growth',
      'Some direct morning sun enhances purple coloring on leaf undersides',
      'Fertilize monthly during growing season with diluted succulent fertilizer',
      'Propagate easily from stem cuttings or by planting the aerial tubers',
      'Trim long vines to encourage fuller growth at the base',
      'Can tolerate some neglect - perfect for frequent travelers'
    ],
    commonProblems: [
      'Root rot: Overwatering is most common cause of death - allow to dry completely',
      'Pale, washed-out leaves: Insufficient light - move to brighter location',
      'Sparse, stretched growth: Not enough light - provide brighter conditions',
      'Shriveled leaves: Severe underwatering - increase watering frequency slightly',
      'Yellowing leaves: Overwatering - reduce watering and check drainage',
      'Bare stems at base: Natural growth pattern - trim and replant to fill in'
    ]
  },
  {
    name: 'Heartleaf Philodendron',
    botanicalName: 'Philodendron hederaceum',
    otherNames: ['Sweetheart Plant', 'Philodendron Scandens', 'Heart-Leaf Philodendron'],
    image: PLANT_IMAGES_BASE_URL + '/Heartleaf%20Philodendron.jpg',
    wateringFrequency: 'Weekly',
    suggestedWateringDays: 7,
    lightRequirement: 'Low to Medium Light',
    careLevel: 'Easy' as const,
    category: 'Hanging & Trailing Plants',
    description: 'Native to the rainforests of Central America and the Caribbean, Heartleaf Philodendron is one of the most popular and easiest houseplants in cultivation, beloved for its glossy, heart-shaped leaves that emerge bronze-tinted and mature to deep green. This vigorous climber/trailer can grow vines 10-20 feet long indoors, making it perfect for cascading from high shelves or hanging baskets, or it can be trained to climb a moss pole or trellis. The plant adapts remarkably well to various light conditions, tolerating low light better than most houseplants while thriving in brighter spots. Its forgiving nature, rapid growth, and easy propagation make it ideal for beginners, while its lush, tropical appearance keeps it popular with experienced plant enthusiasts.',
    toxicity: 'Toxic to pets and humans if ingested - contains calcium oxalate crystals',
    temperature: '65-80°F (18-27°C)',
    humidity: '40-60% (tolerates average home humidity)',
    careInstructions: [
      'Water when top 1-2 inches of soil are dry - typically weekly',
      'Thrives in low to bright indirect light - very adaptable',
      'Can grow in fluorescent lighting, making it perfect for offices',
      'Wipe leaves regularly with damp cloth to remove dust and enhance shine',
      'Propagate easily by taking stem cuttings with at least one node',
      'Pinch growing tips regularly to encourage bushier, fuller growth',
      'Fertilize monthly during growing season with diluted balanced fertilizer',
      'Provide moss pole or trellis for climbing, or allow to trail'
    ],
    commonProblems: [
      'Yellowing leaves: Usually overwatering - allow soil to dry more between waterings',
      'Brown leaf tips: Low humidity, fluoride sensitivity, or inconsistent watering',
      'Leggy, sparse growth: Insufficient light or needs regular pruning',
      'Small leaves: Not enough light - move to brighter location',
      'Aphids or spider mites: Treat with insecticidal soap and isolate plant',
      'Root rot: Overwatering or poor drainage - ensure proper pot drainage'
    ]
  },
  {
    name: 'String of Bananas',
    botanicalName: 'Senecio radicans',
    otherNames: ['Fishhooks Senecio', 'Necklace Plant', 'Banana Vine'],
    image: PLANT_IMAGES_BASE_URL + '/String%20of%20Bananas.jpg',
    wateringFrequency: 'Every 10-14 days',
    suggestedWateringDays: 14,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Easy' as const,
    category: 'Hanging & Trailing Plants',
    description: 'Native to South Africa, String of Bananas is a delightful succulent vine featuring plump, curved leaves that look remarkably like tiny green bananas dangling from thin stems - a whimsical relative of the popular String of Pearls but generally easier to care for. The banana-shaped leaves are actually modified for water storage, allowing the plant to tolerate drought. Stems can trail 2-3 feet long, creating cascading displays that look unique and playful in hanging baskets or spilling over container edges. In bright light, it may produce small white flowers with cinnamon-like fragrance. Fast-growing during warm months and surprisingly forgiving, it\'s more resilient than String of Pearls while offering similar trailing beauty with its own distinctive character.',
    toxicity: 'Toxic to pets and humans if ingested - contains toxic alkaloids',
    temperature: '65-80°F (18-27°C)',
    humidity: '30-50% - tolerates dry air',
    careInstructions: [
      'Water thoroughly only when soil is completely dry - every 10-14 days typically',
      'Use well-draining cactus or succulent potting mix',
      'Provide bright, indirect light - can tolerate some direct morning sun',
      'Handle gently as leaves can detach easily when touched',
      'Fallen leaves and stem segments can be propagated in soil',
      'Fertilize every 4-6 weeks during growing season with diluted succulent fertilizer',
      'Provide drainage holes and never let sit in water',
      'Rotate pot occasionally for even growth on all sides'
    ],
    commonProblems: [
      'Overwatering: Most common cause of death - allow to dry completely between waterings',
      'Shriveling leaves: Severe underwatering - soak thoroughly when dry',
      'Stretching (etiolation): Insufficient light - move to brighter location',
      'Leaf drop when touched: Natural - leaves detach easily, not a problem',
      'Root rot: Overwatering or poor drainage - use fast-draining soil',
      'Pests (rare): Occasionally mealybugs - treat with isopropyl alcohol'
    ]
  },
  {
    name: 'Burro\'s Tail',
    botanicalName: 'Sedum morganianum',
    otherNames: ['Donkey\'s Tail', 'Lamb\'s Tail', 'Burrito', 'Horse\'s Tail'],
    image: PLANT_IMAGES_BASE_URL + '/Burros%20Tail.jpg',
    wateringFrequency: 'Every 10-14 days',
    suggestedWateringDays: 14,
    lightRequirement: 'Bright Direct Light',
    careLevel: 'Easy' as const,
    category: 'Hanging & Trailing Plants',
    description: 'A stunning succulent native to southern Mexico and Honduras, Burro\'s Tail features thick, trailing stems densely covered with plump, tear-drop shaped leaves in blue-green with a dusty, powdery coating (farina) that gives them a frosted appearance. The rope-like stems can grow 1-4 feet long, creating dramatic cascading displays that resemble actual donkey tails - though they\'re quite delicate and leaves drop easily when touched. Mature plants (4+ years old) may produce clusters of small pink or red flowers at stem tips in summer. While the fragile leaves require careful handling, the plant itself is remarkably drought-tolerant and low-maintenance, thriving on neglect better than constant attention. Its sculptural beauty and unique texture make it a prized specimen for hanging baskets.',
    toxicity: 'Non-toxic to pets and humans',
    temperature: '65-75°F (18-24°C) - can tolerate down to 40°F',
    humidity: '20-40% - prefers dry air',
    careInstructions: [
      'Water deeply only when soil is completely dry - every 10-14 days or longer',
      'Use very well-draining cactus or succulent potting mix',
      'Provide bright, direct sunlight for at least 4-6 hours daily',
      'Handle extremely carefully - leaves detach at slightest touch',
      'Never move or rotate plant unnecessarily - causes leaf drop',
      'Place in permanent location where it won\'t be disturbed',
      'Propagate from fallen leaves or stem cuttings laid on soil',
      'Fertilize every 2-3 months during growing season with diluted succulent fertilizer'
    ],
    commonProblems: [
      'Leaf drop: Natural when touched, bumped, or during watering - minimized with gentle care',
      'Shriveling, wrinkled leaves: Needs water - soak thoroughly when dry',
      'Stretching with spaces between leaves: Insufficient light - provide more direct sun',
      'Root rot: Overwatering is fatal - allow soil to dry completely between waterings',
      'Loss of blue color: Too much water or humidity - reduce watering',
      'Stem rot at base: Overwatering combined with poor drainage'
    ]
  }
];