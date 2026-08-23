export interface CleanAirRec {
  id: string;
  title: string;
  category: 'mobility' | 'household' | 'nature' | 'civic';
  categoryLabel: string;
  badge: string;
  impactTier: 'High Impact' | 'Medium Impact' | 'Foundational';
  description: string;
  cityBenefit: string;
  pledgeCategory: string;
  pledgeText: string;
  iconName: string;
}

export const CLEAN_AIR_RECOMMENDATIONS: CleanAirRec[] = [
  // 1. Urban Mobility
  {
    id: 'mob-1',
    title: 'Zero-Idling Habit at Stops & Pickups',
    category: 'mobility',
    categoryLabel: 'Cleaner Mobility',
    badge: 'Immediate Local Relief',
    impactTier: 'High Impact',
    description: 'Turn off vehicle engines whenever stopped for more than 10 seconds (school pick-up lines, curbside waiting, drive-thrus).',
    cityBenefit: 'Eliminates localized PM2.5 and NOx hotspots right at pedestrian and child breathing levels.',
    pledgeCategory: 'Clean Mobility & Anti-Idling',
    pledgeText: 'Turn off vehicle engines when stopped for >10 seconds to eliminate idling exhaust in neighborhood zones.',
    iconName: 'Car'
  },
  {
    id: 'mob-2',
    title: 'Active & Shared Transit Commuting',
    category: 'mobility',
    categoryLabel: 'Cleaner Mobility',
    badge: 'City-Scale Impact',
    impactTier: 'High Impact',
    description: 'Replace 1 to 2 solo automobile trips each week with cycling, walking, light rail, bus transit, or organized carpools.',
    cityBenefit: 'Cuts traffic congestion by up to 20% and prevents ~400 kg of annual greenhouse and tailpipe emissions per commuter.',
    pledgeCategory: 'Clean Mobility & Anti-Idling',
    pledgeText: 'Replace at least 2 solo car trips per week with cycling, walking, or electrified public transit.',
    iconName: 'Bike'
  },
  {
    id: 'mob-3',
    title: 'Eco-Driving & Tire Pressure Optimization',
    category: 'mobility',
    categoryLabel: 'Cleaner Mobility',
    badge: 'Particulate Reduction',
    impactTier: 'Medium Impact',
    description: 'Keep tires inflated to manufacturer specifications and practice gentle acceleration to minimize tire wear and brake pad dust.',
    cityBenefit: 'Non-exhaust emissions (tire and brake wear) account for over 50% of roadway particulate matter.',
    pledgeCategory: 'Clean Mobility & Anti-Idling',
    pledgeText: 'Maintain optimal tire inflation and practice regenerative/gentle braking to reduce roadway particulate dust.',
    iconName: 'Sliders'
  },
  {
    id: 'mob-4',
    title: 'Refuel Vehicles After Sunset on Hot Days',
    category: 'mobility',
    categoryLabel: 'Cleaner Mobility',
    badge: 'Smog Prevention',
    impactTier: 'Medium Impact',
    description: 'Pump gasoline in the cooler evening hours rather than the middle of hot, sunny days.',
    cityBenefit: 'Prevents volatile fuel vapors from reacting photochemically in daytime heat to form ground-level ozone smog.',
    pledgeCategory: 'Clean Mobility & Anti-Idling',
    pledgeText: 'Only refuel gasoline vehicles after sunset during hot weather to reduce daytime photochemical ozone formation.',
    iconName: 'Flame'
  },

  // 2. Household & Yard Care
  {
    id: 'house-1',
    title: 'Transition to Electric Yard & Lawn Tools',
    category: 'household',
    categoryLabel: 'Household & Yard',
    badge: 'Major Emission Cut',
    impactTier: 'High Impact',
    description: 'Replace 2-stroke gasoline leaf blowers, weed trimmers, and mowers with modern lithium battery-electric alternatives.',
    cityBenefit: 'Operating a gas leaf blower for 1 hour emits as much volatile hydrocarbons as driving a passenger car 1,100 miles.',
    pledgeCategory: 'Home Energy & Clean Heating',
    pledgeText: 'Switch all yard maintenance tools to battery-electric to eliminate 2-stroke hydrocarbon exhaust in our neighborhood.',
    iconName: 'Zap'
  },
  {
    id: 'house-2',
    title: 'Eliminate Backyard & Waste Burning',
    category: 'household',
    categoryLabel: 'Household & Yard',
    badge: 'Air Basin Protection',
    impactTier: 'High Impact',
    description: 'Never burn yard leaves, branches, trash, or treated wood in open residential fire pits.',
    cityBenefit: 'Directly prevents dense plumes of black carbon, dioxins, and fine particles that settle in neighboring homes.',
    pledgeCategory: 'Zero Open Burning & Composting',
    pledgeText: 'Commit to zero backyard burning of leaves or waste, opting for municipal composting and green waste recycling.',
    iconName: 'Home'
  },
  {
    id: 'house-3',
    title: 'Switch to Clean Induction & Heat Pumps',
    category: 'household',
    categoryLabel: 'Household & Yard',
    badge: 'Indoor & Urban Quality',
    impactTier: 'High Impact',
    description: 'Upgrade from gas ranges and oil heaters to clean magnetic induction cooking and high-efficiency heat pumps.',
    cityBenefit: 'Dramatically lowers both indoor nitrogen dioxide exposure and building sector combustion emissions.',
    pledgeCategory: 'Home Energy & Clean Heating',
    pledgeText: 'Transition home cooking and heating systems to electric induction cooktops and heat pumps.',
    iconName: 'Zap'
  },
  {
    id: 'house-4',
    title: 'Choose Zero/Low-VOC Paints & Solvents',
    category: 'household',
    categoryLabel: 'Household & Yard',
    badge: 'Chemical Smog Shield',
    impactTier: 'Medium Impact',
    description: 'Use water-based, zero-VOC paints, adhesives, varnishes, and non-aerosol household cleaning supplies.',
    cityBenefit: 'Reduces the evaporative organic chemical vapors that react with sunlight to create toxic city smog.',
    pledgeCategory: 'Low-VOC & Non-Toxic Products',
    pledgeText: 'Exclusively purchase zero-VOC paints and eco-certified non-aerosol cleaning products for home maintenance.',
    iconName: 'ShieldCheck'
  },

  // 3. Urban Greening & Nature Buffers
  {
    id: 'green-1',
    title: 'Plant Particulate-Trapping Foliage & Hedges',
    category: 'nature',
    categoryLabel: 'Urban Nature',
    badge: 'Bio-Filter Barrier',
    impactTier: 'High Impact',
    description: 'Plant rough-leafed native trees, dense evergreen shrubs, and hedges (like privet, cedar, or boxwood) along perimeter fences.',
    cityBenefit: 'Dense roadside vegetative buffers physically trap up to 40% of ambient fine particulate dust before it enters homes.',
    pledgeCategory: 'Urban Greening & Bio-Filters',
    pledgeText: 'Plant particulate-filtering native evergreen trees or perimeter hedges to form a biological dust barrier.',
    iconName: 'Trees'
  },
  {
    id: 'green-2',
    title: 'Cultivate Balcony & Rooftop Green Spaces',
    category: 'nature',
    categoryLabel: 'Urban Nature',
    badge: 'Microclimate Cooling',
    impactTier: 'Medium Impact',
    description: 'Install container plant boxes, balcony green walls, or rooftop gardens in apartment buildings and urban homes.',
    cityBenefit: 'Cools urban heat island microclimates by 1–3°C and absorbs gaseous airborne pollutants.',
    pledgeCategory: 'Urban Greening & Bio-Filters',
    pledgeText: 'Build a container garden or green balcony space to improve local microclimate cooling and biodiversity.',
    iconName: 'Leaf'
  },
  {
    id: 'green-3',
    title: 'Support Tree Canopy Equity in High-Traffic Zones',
    category: 'nature',
    categoryLabel: 'Urban Nature',
    badge: 'Community Reforestation',
    impactTier: 'High Impact',
    description: 'Volunteer with or sponsor neighborhood tree-planting campaigns targeting industrial corridors and transit arterial roads.',
    cityBenefit: 'Expands shade cover in underserved heat islands and creates enduring air-cleansing urban tree corridors.',
    pledgeCategory: 'Urban Greening & Bio-Filters',
    pledgeText: 'Volunteer with community tree-planting groups to expand the urban forest canopy in dense traffic corridors.',
    iconName: 'Trees'
  },

  // 4. Civic & Community Advocacy
  {
    id: 'civic-1',
    title: 'Advocate for Low-Emission Zones & Bike Corridors',
    category: 'civic',
    categoryLabel: 'Civic Advocacy',
    badge: 'Structural Policy',
    impactTier: 'High Impact',
    description: 'Petition municipal leaders for dedicated protected bike highways, pedestrian-only plazas, and fully electrified city bus fleets.',
    cityBenefit: 'Transforms city infrastructure to make clean transportation the safest, fastest, and most convenient choice.',
    pledgeCategory: 'Civic Clean Air Advocacy',
    pledgeText: 'Advocate in municipal forums for protected bike network expansion, bus electrification, and low-emission zones.',
    iconName: 'Megaphone'
  },
  {
    id: 'civic-2',
    title: 'Initiate School Clean-Air & No-Idling Zones',
    category: 'civic',
    categoryLabel: 'Civic Advocacy',
    badge: 'Protect Children',
    impactTier: 'High Impact',
    description: 'Partner with local schools and PTAs to establish designated idle-free drop-off areas and organize walking school buses.',
    cityBenefit: 'Shields developing lungs from peak morning and afternoon diesel and gasoline exhaust concentrations.',
    pledgeCategory: 'Civic Clean Air Advocacy',
    pledgeText: 'Partner with school communities to enact strict idle-free pickup rules and organize neighborhood walking buses.',
    iconName: 'ShieldCheck'
  },
  {
    id: 'civic-3',
    title: 'Monitor & Report Industrial/Diesel Violations',
    category: 'civic',
    categoryLabel: 'Civic Advocacy',
    badge: 'Enforcement Support',
    impactTier: 'Medium Impact',
    description: 'Use city 311 apps or environmental hotlines to report excessive commercial diesel truck idling and illegal industrial smoke.',
    cityBenefit: 'Holds polluters accountable and supports municipal air quality regulation enforcement.',
    pledgeCategory: 'Civic Clean Air Advocacy',
    pledgeText: 'Use municipal 311 and environmental hotlines to report unpermitted burning and commercial diesel idling violations.',
    iconName: 'Activity'
  }
];

export interface DynamicAqiAdvisory {
  severityClass: string;
  badgeBg: string;
  badgeText: string;
  headline: string;
  outdoorAdvice: string;
  indoorAdvice: string;
  commuteAdvice: string;
  actionRecommendation: string;
}

export function getAqiDynamicGuidance(category: string, aqiValue: number, locationName: string): DynamicAqiAdvisory {
  if (category === 'Good' || aqiValue <= 50) {
    return {
      severityClass: 'border-emerald-200 bg-emerald-50/60 text-emerald-950',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badgeText: 'Optimal Clean Air Day',
      headline: `Air quality in ${locationName} is clean and fresh (AQI: ${aqiValue}).`,
      outdoorAdvice: 'Ideal conditions for outdoor sports, cycling, running, and children’s activities.',
      indoorAdvice: 'Excellent time to open windows and naturally ventilate home living spaces.',
      commuteAdvice: 'Take advantage of the fresh air by walking or bicycling for your trips today.',
      actionRecommendation: 'Help keep the air clean: avoid engine idling and support active transit in your neighborhood.'
    };
  }

  if (category === 'Moderate' || aqiValue <= 100) {
    return {
      severityClass: 'border-amber-200 bg-amber-50/60 text-amber-950',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeText: 'Moderate Air Quality Advisory',
      headline: `Air quality in ${locationName} is acceptable (AQI: ${aqiValue}), with mild particulate presence.`,
      outdoorAdvice: 'Unusually sensitive individuals with asthma or cardiovascular conditions should plan periodic rest during prolonged outdoor workouts.',
      indoorAdvice: 'Safe to ventilate indoors, though sensitive individuals may prefer running standard air conditioning/filtration.',
      commuteAdvice: 'Consider combining motorized errands or taking public transit to prevent further smog accumulation.',
      actionRecommendation: 'Avoid using gas lawnmowers or burning wood today, and refuel vehicles after dusk.'
    };
  }

  if (category === 'Unhealthy for Sensitive Groups' || aqiValue <= 150) {
    return {
      severityClass: 'border-orange-200 bg-orange-50/60 text-orange-950',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
      badgeText: 'Sensitive Groups Caution',
      headline: `Elevated pollution levels detected in ${locationName} (AQI: ${aqiValue}).`,
      outdoorAdvice: 'Children, older adults, and individuals with respiratory conditions should reduce prolonged or strenuous outdoor exertion.',
      indoorAdvice: 'Keep windows closed during peak traffic hours and run an indoor HEPA air purifier.',
      commuteAdvice: 'Prefer electrified public rail or bus transit over single-occupancy driving to lower urban emissions.',
      actionRecommendation: 'Switch off vehicle engines when waiting and refrain from any outdoor burning.'
    };
  }

  // Unhealthy or Hazardous
  return {
    severityClass: 'border-rose-200 bg-rose-50/60 text-rose-950',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    badgeText: 'Health Warning: Unhealthy Air',
    headline: `High particulate smog levels detected in ${locationName} (AQI: ${aqiValue}).`,
    outdoorAdvice: 'Everyone should avoid strenuous outdoor physical activities. Wear a well-fitted N95 particulate mask if outdoors.',
    indoorAdvice: 'Keep all windows tightly closed. Run indoor air purifiers with HEPA filtration on high.',
    commuteAdvice: 'Avoid unnecessary driving; use clean public transit or work remotely if possible.',
    actionRecommendation: 'Zero-emission day: avoid any combustion activities, gas tools, or open burning.'
  };
}

export interface ActionInstructionStep {
  stepNumber: number;
  timeframe: string;
  title: string;
  instruction: string;
  concreteDeliverable: string;
  checklistItems: string[];
  suggestedResource: string;
}

export interface CommunityActionAnalysis {
  category: string;
  title: string;
  impactTier: string;
  summaryAnalysis: string;
  keyEmissionsCut: string;
  localHealthBenefit: string;
  steps: ActionInstructionStep[];
}

export function getCommunityActionAnalysis(
  category: string,
  pledgeText: string,
  impactTier: string,
  locationName: string
): CommunityActionAnalysis {
  const normCategory = category.toLowerCase();

  if (normCategory.includes('mobility') || normCategory.includes('transport') || normCategory.includes('idling')) {
    return {
      category: 'Clean Mobility & Anti-Idling',
      title: 'Active Urban Transit & Anti-Idling Community Roadmap',
      impactTier,
      summaryAnalysis: `By committing to clean mobility in ${locationName}, you are tackling the #1 source of ground-level nitrogen dioxide (NO2) and toxic brake/tire fine particulate matter.`,
      keyEmissionsCut: 'Reduces up to 400 kg CO2 and 1.2 kg NOx/PM2.5 per vehicle annually.',
      localHealthBenefit: 'Lowers localized asthma triggers and toxic roadside air pollution at child breathing height.',
      steps: [
        {
          stepNumber: 1,
          timeframe: 'Today (First 24 Hours)',
          title: 'Establish Your Zero-Idling & Commute Habit',
          instruction: 'Turn off your vehicle ignition whenever parked or waiting for more than 10 seconds (such as school drop-off, curbside pickup, or railway crossings). Check tire pressures to vehicle door-jamb specifications.',
          concreteDeliverable: 'Place a friendly "Idle-Free Zone" note or dashboard reminder in your car and download the local public transit or bikeshare app.',
          checklistItems: [
            'Turn off ignition when waiting >10 seconds in parking or drop-off areas',
            'Check tire PSI to prevent excess road particle wear',
            'Plan 1-2 upcoming weekly trips using public transit, cycling, or walking'
          ],
          suggestedResource: 'Local transit agency route planner & EPA IdleBox toolkit'
        },
        {
          stepNumber: 2,
          timeframe: 'This Week (Days 2–7)',
          title: 'Activate School & Neighborhood Anti-Idling Zones',
          instruction: 'Share your pledge with your neighborhood association, PTA, or workplace. Propose establishing a designated "Engine Off" loading zone at local schools and daycares where children congregate.',
          concreteDeliverable: 'Email school administrators or HOA coordinators with a ready-to-print 1-page idle-free pickup zone guideline.',
          checklistItems: [
            'Propose an idle-free banner or signage for the school pickup driveway',
            'Organize a 2-person or 3-person workplace carpool or bike caravan',
            'Share clean transit alternatives on local community chat groups'
          ],
          suggestedResource: 'Clean Air for Schools campaign guide & neighborhood transit groups'
        },
        {
          stepNumber: 3,
          timeframe: 'Month 1 & Beyond',
          title: 'Advocate for Protected Micromobility & Fleet Electrification',
          instruction: 'Engage with your city council or municipal transportation planning board. Advocate for connected, physically protected bicycle lanes and municipal bus fleet electrification.',
          concreteDeliverable: 'Submit public testimony or an online petition requesting dedicated transit corridors and traffic-calmed residential greenways in your district.',
          checklistItems: [
            'Submit public comment at city council transportation hearings',
            'Support municipal requests for zero-emission electric bus funding',
            'Join or volunteer with a local bicycle/pedestrian advocacy coalition'
          ],
          suggestedResource: 'City Department of Transportation master plan & OpenStreetMap transit map'
        }
      ]
    };
  }

  if (normCategory.includes('energy') || normCategory.includes('heat') || normCategory.includes('home')) {
    return {
      category: 'Home Energy & Clean Heating',
      title: 'Residential Decarbonization & Clean Heating Action Guide',
      impactTier,
      summaryAnalysis: `Transitioning residential heating, cooking, and energy in ${locationName} eliminates both indoor nitrogen dioxide pollution and building-sector winter particulate emissions.`,
      keyEmissionsCut: 'Prevents 1.5–3.5 metric tons of CO2 and eliminates indoor NO2/CO gas combustion.',
      localHealthBenefit: 'Protects household respiratory systems and improves indoor air quality by up to 50%.',
      steps: [
        {
          stepNumber: 1,
          timeframe: 'Today (First 24 Hours)',
          title: 'Optimize Household Ventilation & Clean Cooking Routine',
          instruction: 'Always operate high-efficiency range hoods when cooking. Inspect your HVAC air filter and upgrade to MERV 13+ to trap smoke, pollen, and fine dust particles.',
          concreteDeliverable: 'Set programmable thermostats to energy-saving temperatures and audit home windows for draft air-sealing.',
          checklistItems: [
            'Turn on range exhaust hood or open window during cooking',
            'Check and replace central HVAC air filter with MERV 13 rating',
            'Lower water heater setpoint to 120°F (49°C) to conserve grid energy'
          ],
          suggestedResource: 'EPA Indoor Air Quality (IAQ) Home Assessment Checklist'
        },
        {
          stepNumber: 2,
          timeframe: 'This Week (Days 2–7)',
          title: 'Explore Electrification Rebates & Clean Grid Tariffs',
          instruction: 'Check your local electric utility website for heat pump HVAC, heat pump water heater, and induction cooktop incentives or tax credits.',
          concreteDeliverable: 'Enroll in your utility’s 100% renewable or clean energy green power purchasing tariff.',
          checklistItems: [
            'Enroll in municipal 100% green grid power / community solar option',
            'Research local heat pump and induction stove rebate programs',
            'Schedule a professional home energy & air-sealing assessment'
          ],
          suggestedResource: 'DSIRE Clean Energy Incentives Database & local electrical utility portal'
        },
        {
          stepNumber: 3,
          timeframe: 'Month 1 & Beyond',
          title: 'Promote Multi-Family & Neighborhood Clean Building Codes',
          instruction: 'Help neighbors and multi-family property managers navigate heat pump transitions, and support municipal all-electric new construction ordinances.',
          concreteDeliverable: 'Organize a neighborhood clean energy webinar or invite a local heat pump installer for a group consultation discount.',
          checklistItems: [
            'Share electrification case study and utility bill savings with neighbors',
            'Advocate for city net-zero building code adoption in municipal meetings',
            'Support local heat pump subsidies for low-income housing communities'
          ],
          suggestedResource: 'Building Decarbonization Coalition & municipal sustainability office'
        }
      ]
    };
  }

  if (normCategory.includes('burn') || normCategory.includes('waste') || normCategory.includes('compost')) {
    return {
      category: 'Zero Open Burning & Composting',
      title: 'Smoke Prevention & Organic Resource Recovery Plan',
      impactTier,
      summaryAnalysis: `Ending open residential burning in ${locationName} eliminates one of the most toxic, localized sources of black carbon, dioxins, and fine particulate spikes.`,
      keyEmissionsCut: 'Stops hundreds of pounds of dense PM2.5 and carcinogenic smoke plumes from neighborhood valleys.',
      localHealthBenefit: 'Immediately safeguards neighbors, elderly residents, and children with asthma or lung conditions.',
      steps: [
        {
          stepNumber: 1,
          timeframe: 'Today (First 24 Hours)',
          title: 'Establish Your Zero-Burn Household Protocol',
          instruction: 'Commit to zero backyard burning of leaves, treated timber, and household waste. Set aside dry yard trimmings for municipal green bin collection or composting.',
          concreteDeliverable: 'Designate a 3x3 ft garden corner for backyard composting or request a green waste cart from your city sanitation department.',
          checklistItems: [
            'Halt all residential fire-pit burning of yard waste and brush',
            'Set up a home composting bin or separate organic waste container',
            'Mulch fallen leaves directly onto lawn or garden beds with mower'
          ],
          suggestedResource: 'EPA Guide to Backyard Composting & Municipal Waste Guidelines'
        },
        {
          stepNumber: 2,
          timeframe: 'This Week (Days 2–7)',
          title: 'Engage Neighbors on Smoke Safety & Shared Chipping',
          instruction: 'Connect with immediate neighbors to explain how localized wood and leaf smoke lingers in valley inversions. Coordinate a shared neighborhood wood chipper or green waste drop-off day.',
          concreteDeliverable: 'Post a helpful green waste schedule and burn-ban alert notice on your community message board.',
          checklistItems: [
            'Inform adjacent neighbors about local seasonal burn ban restrictions',
            'Organize a shared neighborhood green waste drop-off or chipping day',
            'Offer surplus leaf mulch to neighborhood community garden projects'
          ],
          suggestedResource: 'County Air Pollution Control District Burn Rules & Local Sanitation Schedule'
        },
        {
          stepNumber: 3,
          timeframe: 'Month 1 & Beyond',
          title: 'Support Municipal Yard Waste Collection & Smoke Monitoring',
          instruction: 'Advocate for year-round curbside municipal composting and prompt reporting/enforcement of unpermitted industrial and agricultural open burning.',
          concreteDeliverable: 'Report persistent illegal burning hotspots via 311 or regional air quality compliance portals.',
          checklistItems: [
            'Lobby city waste department for universal curbside food/yard compost pickup',
            'Use municipal 311 app to report hazardous illegal smoke and open burning',
            'Distribute clean air educational materials at neighborhood block associations'
          ],
          suggestedResource: 'State Department of Environmental Protection Air Division hotline'
        }
      ]
    };
  }

  if (normCategory.includes('green') || normCategory.includes('tree') || normCategory.includes('nature') || normCategory.includes('bio')) {
    return {
      category: 'Urban Greening & Bio-Filters',
      title: 'Urban Canopy & Biological Air Filtration Campaign',
      impactTier,
      summaryAnalysis: `Expanding vegetative buffers in ${locationName} creates living particulate filters that capture airborne roadway dust and cool dangerous urban heat islands.`,
      keyEmissionsCut: 'Captures up to 40% of roadside particulate matter and sequesters carbon dioxide continuously.',
      localHealthBenefit: 'Reduces ambient air temperatures by 1–3°C and absorbs volatile organic compounds and NOx.',
      steps: [
        {
          stepNumber: 1,
          timeframe: 'Today (First 24 Hours)',
          title: 'Install Your Home & Balcony Bio-Filter Barrier',
          instruction: 'Place rough-leafed and evergreen plants (such as boxwood, cedar, English ivy, or snake plants) along balcony railings and street-facing window perimeters to intercept roadway dust.',
          concreteDeliverable: 'Water, mulch, and clear litter around existing street trees adjacent to your sidewalk or driveway.',
          checklistItems: [
            'Position potted evergreen plants or shrubs along perimeter windows/porches',
            'Add 2–3 inches of organic mulch around baseline of street trees',
            'Inspect existing garden greenery for healthy foliage growth'
          ],
          suggestedResource: 'US Forest Service i-Tree Toolkit & Native Plant Society Directory'
        },
        {
          stepNumber: 2,
          timeframe: 'This Week (Days 2–7)',
          title: 'Identify Community Planting Corridors & Green Spots',
          instruction: 'Survey your neighborhood for unshaded asphalt stretches, school perimeters, and industrial road buffers lacking tree canopy. Connect with local urban forestry nonprofits.',
          concreteDeliverable: 'Sign up for the next municipal or nonprofit community tree planting volunteer event.',
          checklistItems: [
            'Map 3-5 high-priority planting sites along busy traffic corridors',
            'Register as a volunteer with local urban forestry & parks organizations',
            'Encourage neighboring property owners to apply for free street tree permits'
          ],
          suggestedResource: 'Arbor Day Foundation Community Canopy Program & Municipal Tree Board'
        },
        {
          stepNumber: 3,
          timeframe: 'Month 1 & Beyond',
          title: 'Advocate for 30%+ Canopy Equity in Urban Heat Islands',
          instruction: 'Petition city planners for dedicated capital investments in street tree maintenance and vegetative particulate barriers along highway soundwalls.',
          concreteDeliverable: 'Attend city council parks & recreation sessions to support urban tree preservation bylaws and canopy expansion funding.',
          checklistItems: [
            'Lobby for strict protections against mature street tree removals',
            'Champion green buffer soundwalls along major arterial roadways',
            'Help establish a community orchard or native pollinator garden pocket park'
          ],
          suggestedResource: 'American Forests Tree Equity Score & City Urban Forestry Master Plan'
        }
      ]
    };
  }

  if (normCategory.includes('voc') || normCategory.includes('toxic') || normCategory.includes('product')) {
    return {
      category: 'Low-VOC & Non-Toxic Products',
      title: 'Smog-Prevention & Chemical Safety Action Plan',
      impactTier,
      summaryAnalysis: `By eliminating volatile organic compound (VOC) emissions from everyday products in ${locationName}, you stop the chemical precursors that react in sunlight to create toxic ground-level ozone.`,
      keyEmissionsCut: 'Prevents kilograms of evaporative reactive organic gases from entering the urban airshed.',
      localHealthBenefit: 'Reduces headaches, mucous membrane irritation, and long-term chemical sensitivity.',
      steps: [
        {
          stepNumber: 1,
          timeframe: 'Today (First 24 Hours)',
          title: 'Audit Household Paints, Solvents & Aerosol Sprays',
          instruction: 'Inspect cleaning closets and garage shelves. Replace aerosol cans with pump-spray or manual dispensers, and store solvent cans in airtight, sealed containers away from heat.',
          concreteDeliverable: 'Create simple non-toxic household cleaners (vinegar, baking soda, castile soap) and recycle old solvent cans safely at hazardous waste facilities.',
          checklistItems: [
            'Check cleaning products for Green Seal / Safer Choice eco-certifications',
            'Properly seal half-used paint, varnish, and adhesive containers',
            'Open windows to ensure cross-ventilation whenever using craft adhesives'
          ],
          suggestedResource: 'EPA Safer Choice Standard & Household Hazardous Waste Drop-off Locator'
        },
        {
          stepNumber: 2,
          timeframe: 'This Week (Days 2–7)',
          title: 'Commit to Zero-VOC Home Improvement Standards',
          instruction: 'Specify exclusively zero-VOC, waterborne paints and low-emission caulks for all upcoming home renovation or DIY maintenance projects.',
          concreteDeliverable: 'Request that your apartment building manager or office procurement team adopt zero-VOC facility maintenance supplies.',
          checklistItems: [
            'Purchase zero-VOC paint bases and colorants for home touch-ups',
            'Ask building maintenance to use non-aerosol, fragrance-free cleaning agents',
            'Share non-toxic cleaning recipes with roommates, family, and neighbors'
          ],
          suggestedResource: 'Green Seal Certified Products Directory & Indoor Air Quality Association'
        },
        {
          stepNumber: 3,
          timeframe: 'Month 1 & Beyond',
          title: 'Support Clean Consumer Standards & Commercial VOC Caps',
          instruction: 'Advocate for stringent VOC content limits on commercial coatings, industrial degreasers, and consumer products in your regional air basin.',
          concreteDeliverable: 'Submit feedback to regional air quality regulators supporting tightened chemical emission standards and toxic chemical phase-outs.',
          checklistItems: [
            'Support regional air management district consumer product VOC limits',
            'Encourage local hardware stores to prominently feature zero-VOC products',
            'Promote annual neighborhood hazardous waste collection drives'
          ],
          suggestedResource: 'Air Quality Management District rules & South Coast AQMD Clean Air Standards'
        }
      ]
    };
  }

  // Default: Civic Clean Air Advocacy
  return {
    category: 'Civic Clean Air Advocacy',
    title: 'Community Clean Air Advocacy & Civic Action Guide',
    impactTier,
    summaryAnalysis: `Civic leadership and hyper-local advocacy in ${locationName} turn individual pledges into permanent municipal policy, clean zoning buffers, and expanded monitoring networks.`,
    keyEmissionsCut: 'Drives city-wide structural emissions reductions across transportation and industrial sectors.',
    localHealthBenefit: 'Protects vulnerable populations across schools, senior centers, and environmental justice neighborhoods.',
    steps: [
      {
        stepNumber: 1,
        timeframe: 'Today (First 24 Hours)',
        title: 'Activate Your Hyper-Local Air Quality Monitoring',
        instruction: 'Bookmark this air quality tracker, check the dominant pollutant index daily, and identify your local Air Quality Management District (AQMD) representatives and city council district contact.',
        concreteDeliverable: 'Subscribe to local air quality alert notifications and share today’s AQI status with family and neighbors.',
        checklistItems: [
          'Bookmark this live SDG 13 Global Air Quality Tracker for daily checks',
          'Locate your district city council representative and contact info',
          'Download official regional AQI emergency alert app'
        ],
        suggestedResource: 'AirNow.gov, OpenAQ Global Repository & local environmental agency directory'
      },
      {
        stepNumber: 2,
        timeframe: 'This Week (Days 2–7)',
        title: 'Organize a School or Neighborhood Clean Air Action Circle',
        instruction: 'Convene with 3-5 neighbors, parents, or local community organizers to draft a clean air action letter for your local school board or neighborhood council.',
        concreteDeliverable: 'Send a formal request for an idle-free pickup zone and hyper-local air sensor installation at your local community center or school.',
        checklistItems: [
          'Draft a 2-paragraph clean air action resolution for your PTA or HOA',
          'Propose installing a low-cost community air sensor (e.g. PurpleAir)',
          'Request municipal enforcement of commercial truck route speed and idling laws'
        ],
        suggestedResource: 'EPA Citizen Science Clean Air Tool & Community Air Monitoring Network guide'
      },
      {
        stepNumber: 3,
        timeframe: 'Month 1 & Beyond',
        title: 'Lead Municipal Testimony for Clean Air Equity & Green Corridors',
        instruction: 'Deliver public testimony at city council budget hearings demanding dedicated investments in zero-emission transit, protected active transportation, and industrial buffer zones.',
        concreteDeliverable: 'Partner with local environmental justice organizations to present an annual Community Clean Air Report to city leadership.',
        checklistItems: [
          'Deliver 2-minute public comment at city council or transit board meetings',
          'Advocate for low-emission delivery vehicle zones in dense downtown centers',
          'Champion mandatory 500-foot buffer zones between industrial depots and schools'
        ],
        suggestedResource: 'National Association of Clean Air Agencies & Climate Action Network'
      }
    ]
  };
}

