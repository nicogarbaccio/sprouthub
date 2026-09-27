/**
 * The plant catalog, one JSON file per plant in ./plants.
 *
 * Order matters: partial-name lookups return the first match (e.g. "monstera" resolves to
 * Monstera Deliciosa). Add new plants at the end. The catalog test fails if a file in
 * ./plants isn't listed here.
 */
import peaceLily from './plants/peace-lily.json';
import flamingoFlower from './plants/flamingo-flower.json';
import africanViolet from './plants/african-violet.json';
import christmasCactus from './plants/christmas-cactus.json';
import begoniaRex from './plants/begonia-rex.json';
import sowbread from './plants/sowbread.json';
import geranium from './plants/geranium.json';
import flamingKaty from './plants/flaming-katy.json';
import touchMeNot from './plants/touch-me-not.json';
import orchid from './plants/orchid.json';
import floweringMaple from './plants/flowering-maple.json';
import hibiscus from './plants/hibiscus.json';
import paperFlower from './plants/paper-flower.json';
import crownOfThorns from './plants/crown-of-thorns.json';
import pentas from './plants/pentas.json';
import monsteraDeliciosa from './plants/monstera-deliciosa.json';
import monsteraThaiConstellation from './plants/monstera-thai-constellation.json';
import birdOfParadise from './plants/bird-of-paradise.json';
import africanMask from './plants/african-mask.json';
import monsteraAdansonii from './plants/monstera-adansonii.json';
import dumbCane from './plants/dumb-cane.json';
import philodendronBrasil from './plants/philodendron-brasil.json';
import kentiaPalm from './plants/kentia-palm.json';
import bananaPlant from './plants/banana-plant.json';
import croton from './plants/croton.json';
import philodendronPinkPrincess from './plants/philodendron-pink-princess.json';
import elephantEar from './plants/elephant-ear.json';
import snakePlant from './plants/snake-plant.json';
import aloeVera from './plants/aloe-vera.json';
import jadePlant from './plants/jade-plant.json';
import echeveria from './plants/echeveria.json';
import stringOfPearls from './plants/string-of-pearls.json';
import crystalSucculent from './plants/crystal-succulent.json';
import barrelCactus from './plants/barrel-cactus.json';
import lithops from './plants/lithops.json';
import pricklyPearCactus from './plants/prickly-pear-cactus.json';
import zebraPlant from './plants/zebra-plant.json';
import paddlePlant from './plants/paddle-plant.json';
import stringOfButtons from './plants/string-of-buttons.json';
import aloeAristata from './plants/aloe-aristata.json';
import ghostPlant from './plants/ghost-plant.json';
import pothos from './plants/pothos.json';
import marbleQueenPothos from './plants/marble-queen-pothos.json';
import snowQueenPothos from './plants/snow-queen-pothos.json';
import manjulaPothos from './plants/manjula-pothos.json';
import pearlsAndJadePothos from './plants/pearls-and-jade-pothos.json';
import satinPothos from './plants/satin-pothos.json';
import spiderPlant from './plants/spider-plant.json';
import englishIvy from './plants/english-ivy.json';
import stringOfHearts from './plants/string-of-hearts.json';
import heartleafPhilodendron from './plants/heartleaf-philodendron.json';
import stringOfBananas from './plants/string-of-bananas.json';
import burrosTail from './plants/burros-tail.json';
import fiddleLeafFig from './plants/fiddle-leaf-fig.json';
import rubberPlant from './plants/rubber-plant.json';
import ficusElasticaTineke from './plants/ficus-elastica-tineke.json';
import dracaena from './plants/dracaena.json';
import schefflera from './plants/schefflera.json';
import yucca from './plants/yucca.json';
import norfolkPine from './plants/norfolk-pine.json';
import zzPlant from './plants/zz-plant.json';
import bostonFern from './plants/boston-fern.json';
import chineseMoneyPlant from './plants/chinese-money-plant.json';
import calathea from './plants/calathea.json';
import majestyPalm from './plants/majesty-palm.json';
import peperomia from './plants/peperomia.json';
import ponytailPalm from './plants/ponytail-palm.json';
import prayerPlant from './plants/prayer-plant.json';
import parlorPalm from './plants/parlor-palm.json';
import maidenhairFern from './plants/maidenhair-fern.json';
import staghornFern from './plants/staghorn-fern.json';
import birdsNestFern from './plants/birds-nest-fern.json';
import coleus from './plants/coleus.json';
import caladium from './plants/caladium.json';
import nervePlant from './plants/nerve-plant.json';
import castIronPlant from './plants/cast-iron-plant.json';
import polkaDotPlant from './plants/polka-dot-plant.json';
import aluminumPlant from './plants/aluminum-plant.json';
import swedishIvy from './plants/swedish-ivy.json';
import arrowheadPlant from './plants/arrowhead-plant.json';
import wanderingJew from './plants/wandering-jew.json';
import chineseEvergreen from './plants/chinese-evergreen.json';
import blushingBride from './plants/blushing-bride.json';
import spanishMoss from './plants/spanish-moss.json';
import queenOfAirPlants from './plants/queen-of-air-plants.json';
import pinkQuill from './plants/pink-quill.json';
import potbellyAirPlant from './plants/potbelly-air-plant.json';

export const catalogJson: unknown[] = [
  peaceLily,
  flamingoFlower,
  africanViolet,
  christmasCactus,
  begoniaRex,
  sowbread,
  geranium,
  flamingKaty,
  touchMeNot,
  orchid,
  floweringMaple,
  hibiscus,
  paperFlower,
  crownOfThorns,
  pentas,
  monsteraDeliciosa,
  monsteraThaiConstellation,
  birdOfParadise,
  africanMask,
  monsteraAdansonii,
  dumbCane,
  philodendronBrasil,
  kentiaPalm,
  bananaPlant,
  croton,
  philodendronPinkPrincess,
  elephantEar,
  snakePlant,
  aloeVera,
  jadePlant,
  echeveria,
  stringOfPearls,
  crystalSucculent,
  barrelCactus,
  lithops,
  pricklyPearCactus,
  zebraPlant,
  paddlePlant,
  stringOfButtons,
  aloeAristata,
  ghostPlant,
  pothos,
  marbleQueenPothos,
  snowQueenPothos,
  manjulaPothos,
  pearlsAndJadePothos,
  satinPothos,
  spiderPlant,
  englishIvy,
  stringOfHearts,
  heartleafPhilodendron,
  stringOfBananas,
  burrosTail,
  fiddleLeafFig,
  rubberPlant,
  ficusElasticaTineke,
  dracaena,
  schefflera,
  yucca,
  norfolkPine,
  zzPlant,
  bostonFern,
  chineseMoneyPlant,
  calathea,
  majestyPalm,
  peperomia,
  ponytailPalm,
  prayerPlant,
  parlorPalm,
  maidenhairFern,
  staghornFern,
  birdsNestFern,
  coleus,
  caladium,
  nervePlant,
  castIronPlant,
  polkaDotPlant,
  aluminumPlant,
  swedishIvy,
  arrowheadPlant,
  wanderingJew,
  chineseEvergreen,
  blushingBride,
  spanishMoss,
  queenOfAirPlants,
  pinkQuill,
  potbellyAirPlant,
];
