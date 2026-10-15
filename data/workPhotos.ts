// Real job photos from FSC's CompanyCam (curated 2026-10-14). City-level locations only.
export type WorkPhoto = { src: string; alt: string; city: string; caption: string; width: number; height: number };

const p = (file: string, alt: string, city: string, caption: string, landscape = false): WorkPhoto => ({
  src: `/images/work/${file}.webp`, alt, city, caption, width: landscape ? 1600 : 1200, height: landscape ? 1200 : 1600,
});

export const workPhotos = {
  estateEntrance: p('swing-gate-estate-entrance_clermont', 'Black ornamental double swing gate between white pillars at an estate entrance in Clermont, FL', 'Clermont', 'Estate swing gate', true),
  estateFront: p('swing-gate-estate-front-view_clermont', 'Straight-on view of a finished estate swing gate in Clermont, FL', 'Clermont', 'Estate swing gate', true),
  estateNight: p('swing-gate-night-lighting_clermont', 'Lit gated estate entrance at night in Clermont, FL', 'Clermont', 'Entry lighting at night', true),
  communityGroveland: p('swing-gate-community-entrance_groveland', 'Community entrance swing gate against a blue sky in Groveland, FL', 'Groveland', 'Community entrance'),
  openBrickOrlando: p('swing-gate-open-brick-columns_orlando', 'Swing gate open between brick columns at a landscaped entry in Orlando, FL', 'Orlando', 'Community swing gate'),
  operatorStonePillar: p('swing-gate-stone-pillar-operator_groveland', 'Swing gate operator arm mounted on a stone pillar in Groveland, FL', 'Groveland', 'Swing gate operator'),
  communityEntry: p('swing-gate-community-entry_groveland', 'Ornamental swing gate across a community drive in Groveland, FL', 'Groveland', 'Community entry gate'),
  dualSwing: p('dual-swing-gate-entry_groveland', 'Dual swing gate leaves at a community entry in Groveland, FL', 'Groveland', 'Dual swing gates'),
  brickDetail: p('swing-gate-brick-column-detail_orlando', 'Swing gate hinge side along a brick column in Orlando, FL', 'Orlando', 'Swing gate detail'),
  archedTampa: p('arched-swing-gate-entrance_tampa', 'Arched swing gate at an apartment community entrance in Tampa, FL', 'Tampa', 'Apartment entry gate'),
  operatorLutz: p('swing-gate-operator-install_lutz', 'Swing gate operator mounted to a gate arm in Lutz, FL', 'Lutz', 'Operator install'),
  slideOperatorPad: p('slide-gate-operator-pad_groveland', 'Slide gate operator on a concrete pad in Groveland, FL', 'Groveland', 'Slide gate operator'),
  operatorCloseup: p('gate-operator-closeup_town-n-country', 'Close-up of a gate operator housing in Tampa, FL', 'Tampa', 'Gate operator'),
  slideOperatorHousing: p('slide-gate-operator-housing_polk-city', 'Operator cabinet beside a slide gate in Polk City, FL', 'Polk City', 'Slide gate operator'),
  operatorPedestal: p('gate-operator-pedestal_polk-city', 'Gate operator pedestal at a community entry in Polk City, FL', 'Polk City', 'Operator pedestal'),
  controllerBoard: p('gate-controller-board_pinellas-park', 'Gate controller board inside its enclosure during service in Pinellas Park, FL', 'Pinellas Park', 'Controller service'),
  ornamentalSlide: p('ornamental-slide-gate_pinellas-park', 'Tall ornamental slide gate in Pinellas Park, FL', 'Pinellas Park', 'Ornamental slide gate'),
  storageSlide: p('storage-facility-slide-gate_orlando', 'Slide gate at a self-storage facility entrance in Orlando, FL', 'Orlando', 'Storage facility gate'),
  callBox: p('telephone-entry-call-box_pinellas-park', 'Telephone entry call box on a post at a gate in Pinellas Park, FL', 'Pinellas Park', 'Telephone entry'),
  videoIntercom: p('video-intercom-wood-post_clermont', 'Video intercom mounted on a wood post at a gated entry in Clermont, FL', 'Clermont', 'Video intercom'),
  touchscreen: p('touchscreen-entry-panel_clermont', 'Touchscreen keypad entry panel set into a stone column in Clermont, FL', 'Clermont', 'Touchscreen entry'),
  keypadColumn: p('keypad-column-mount_orlando', 'Entry keypad mounted in a column in Orlando, FL', 'Orlando', 'Column keypad'),
  wallKeypad: p('wall-keypad-access-control_orlando', 'Wall-mounted keypad reader in Orlando, FL', 'Orlando', 'Keypad reader'),
  pedestalKeypad: p('access-control-pedestal-keypad_groveland', 'Access control keypad on a pedestal at a drive lane in Groveland, FL', 'Groveland', 'Pedestal keypad'),
  camera: p('commercial-security-camera_tampa', 'Exterior security camera on a commercial building in Tampa, FL', 'Tampa', 'Commercial camera'),
} satisfies Record<string, WorkPhoto>;

export type WorkPhotoKey = keyof typeof workPhotos;

/** Homepage recent-work gallery, lead photo first. */
export const recentWork: WorkPhoto[] = [
  workPhotos.estateEntrance, workPhotos.estateNight, workPhotos.communityGroveland, workPhotos.openBrickOrlando,
  workPhotos.videoIntercom, workPhotos.ornamentalSlide, workPhotos.touchscreen, workPhotos.archedTampa, workPhotos.dualSwing,
];

/** Photos shown on each service page. */
export const servicePhotos: Record<string, WorkPhoto[]> = {
  'security-gate-systems': [workPhotos.estateFront, workPhotos.ornamentalSlide, workPhotos.communityEntry, workPhotos.storageSlide],
  'gate-automation': [workPhotos.slideOperatorPad, workPhotos.operatorStonePillar, workPhotos.operatorLutz, workPhotos.slideOperatorHousing],
  'gate-repair': [workPhotos.controllerBoard, workPhotos.operatorCloseup, workPhotos.brickDetail, workPhotos.operatorPedestal],
  'maintenance-plans': [workPhotos.operatorStonePillar, workPhotos.controllerBoard, workPhotos.dualSwing, workPhotos.slideOperatorHousing],
  'access-control': [workPhotos.touchscreen, workPhotos.callBox, workPhotos.keypadColumn, workPhotos.pedestalKeypad],
  'video-surveillance': [workPhotos.camera, workPhotos.estateNight],
  'security-system-integration': [workPhotos.videoIntercom, workPhotos.wallKeypad, workPhotos.estateEntrance, workPhotos.storageSlide],
  'emergency-service': [workPhotos.controllerBoard, workPhotos.operatorCloseup, workPhotos.storageSlide],
};
