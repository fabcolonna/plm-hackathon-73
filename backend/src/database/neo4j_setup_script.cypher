// ============================================================================
// Script Cypher pour créer et peupler la base Neo4j
// Batterie Passport - Système d'Aide à la Décision
// ============================================================================

// Nettoyer la base de données (optionnel - à utiliser avec précaution)
// MATCH (n) DETACH DELETE n;

// ============================================================================
// CRÉATION DES CONFIGURATIONS MARCHÉ
// ============================================================================

CREATE (mkt1:MarketConfig {
    id: 'MKT_STD_2024',
    name: 'Marché Standard 2024',
    weight_reuse: 1.0,
    weight_remanufacture: 1.0,
    weight_repurpose: 1.0,
    weight_recycle: 1.0,
    description: 'Configuration marché standard avec poids équilibrés'
})

CREATE (mkt2:MarketConfig {
    id: 'MKT_FAVOR_REUSE_2024',
    name: 'Marché Favorisant Réutilisation 2024',
    weight_reuse: 1.5,
    weight_remanufacture: 1.2,
    weight_repurpose: 1.0,
    weight_recycle: 0.8,
    description: 'Marché favorisant la réutilisation et le remanufacturing'
})

CREATE (mkt3:MarketConfig {
    id: 'MKT_FAVOR_RECYCLE_2024',
    name: 'Marché Favorisant Recyclage 2024',
    weight_reuse: 0.8,
    weight_remanufacture: 0.9,
    weight_repurpose: 0.9,
    weight_recycle: 1.3,
    description: 'Marché avec forte demande en matériaux recyclés'
});

// ============================================================================
// BATTERIE 1: Batterie en excellent état - LFP - E-bike
// Scénario: SOH élevé, pas de défauts, chimie LFP stable
// Résultat attendu: REUSE ou REPURPOSE
// ============================================================================

CREATE (b1:Battery {
    id: 'BAT_001',
    serial_number: 'SN-LFP-2024-001',
    created_at: datetime()
})

CREATE (p1:BatteryPassport {
    // Attribute #1: State of Health (SOH)
    soh_percent: 92.5,
    
    // Attribute #2: State of Charge (SOC)
    soc_percent: 75.0,
    
    // Attribute #3: Known defects or malfunctions
    known_defects: false,
    critical_defects: false,
    
    // Attribute #4: Battery model
    battery_model: 'e-bike-2024-LFP',
    model: 'e-bike-2024-LFP',
    
    // Attribute #5: Battery chemistry
    chemistry: 'LFP',
    
    // Attribute #6: Date of placing on the market
    date_placing_market: '2024-01-15',
    market_date: '2024-01-15',
    
    // Attribute #7: Total energy throughput
    total_energy_throughput_kwh: 350,
    energy_throughput: 350,
    
    // Attribute #8: Potentials for repurposing/remanufacturing
    potentials_repurposing_remanufacturing: 'repurpose, remanufacture',
    repurpose_potential: 'repurpose, remanufacture',
    
    // Attribute #9: Design for disassembly
    design_for_disassembly: 'high',
    design_modularity_score: 9,
    modularity: 'high',
    
    // Attribute #10: Capacity fade
    capacity_fade_percent_per_year: 1.2,
    capacity_fade: 1.2,
    
    // Attribute #11: Informations on accidents
    accidents: false,
    accident_history: false,
    history_of_abuse: false,
    
    // Attribute #12: Battery Status
    battery_status: 'original',
    status: 'original',
    
    // Propriétés additionnelles
    capacity_nominal_kwh: 2.5,
    voltage_nominal: 48,
    manufacturer: 'BatteryCorp',
    passport_id: 'PASSPORT-LFP-001'
})

CREATE (d1:SortingDiagnosis {
    soh_percent: 92.5,
    soc_percent: 75.0,
    internal_resistance_mOhm: 22,
    known_defects: false,
    critical_defects: false,
    accidents: false,
    history_of_abuse: false,
    battery_status: 'original',
    date: datetime(),
    total_energy_throughput_kwh: 350,
    temperature_celsius: 25,
    voltage_measured: 48.2,
    inspector: 'Inspector_001',
    notes: 'Batterie en excellent état, aucune anomalie détectée'
})

CREATE (b1)-[:HAS_PASSPORT]->(p1)
CREATE (b1)-[:UNDERWENT_DIAGNOSIS]->(d1);

// ============================================================================
// BATTERIE 2: Batterie moyenne - NMC - Automobile - Design modulaire
// Scénario: SOH moyen, design modulaire, chimie NMC
// Résultat attendu: REMANUFACTURE ou RECYCLE (valeur matériaux)
// ============================================================================

CREATE (b2:Battery {
    id: 'BAT_002',
    serial_number: 'SN-NMC-2023-002',
    created_at: datetime()
})

CREATE (p2:BatteryPassport {
    // Attribute #1: State of Health (SOH)
    soh_percent: 78.0,
    
    // Attribute #2: State of Charge (SOC)
    soc_percent: 45.0,
    
    // Attribute #3: Known defects or malfunctions
    known_defects: 'Minor cell imbalance detected',
    critical_defects: false,
    
    // Attribute #4: Battery model
    battery_model: 'automotive-NMC-2023',
    model: 'automotive-NMC-2023',
    
    // Attribute #5: Battery chemistry
    chemistry: 'NMC',
    
    // Attribute #6: Date of placing on the market
    date_placing_market: '2023-06-20',
    market_date: '2023-06-20',
    
    // Attribute #7: Total energy throughput
    total_energy_throughput_kwh: 850,
    energy_throughput: 850,
    
    // Attribute #8: Potentials for repurposing/remanufacturing
    potentials_repurposing_remanufacturing: 'remanufacture',
    repurpose_potential: 'remanufacture',
    
    // Attribute #9: Design for disassembly
    design_for_disassembly: 'high',
    design_modularity_score: 10,
    modularity: 'high',
    
    // Attribute #10: Capacity fade
    capacity_fade_percent_per_year: 2.8,
    capacity_fade: 2.8,
    
    // Attribute #11: Informations on accidents
    accidents: false,
    accident_history: false,
    history_of_abuse: false,
    
    // Attribute #12: Battery Status
    battery_status: 'original',
    status: 'original',
    
    // Propriétés additionnelles
    capacity_nominal_kwh: 60.0,
    voltage_nominal: 400,
    manufacturer: 'AutoBatteryInc',
    passport_id: 'PASSPORT-NMC-002'
})

CREATE (d2:SortingDiagnosis {
    soh_percent: 78.0,
    soc_percent: 45.0,
    internal_resistance_mOhm: 35,
    known_defects: 'Minor cell imbalance detected',
    critical_defects: false,
    accidents: false,
    history_of_abuse: false,
    battery_status: 'original',
    date: datetime(),
    total_energy_throughput_kwh: 850,
    temperature_celsius: 28,
    voltage_measured: 398.5,
    inspector: 'Inspector_002',
    notes: 'Batterie avec déséquilibre mineur entre cellules, design modulaire permet remanufacturing'
})

CREATE (b2)-[:HAS_PASSPORT]->(p2)
CREATE (b2)-[:UNDERWENT_DIAGNOSIS]->(d2);

// ============================================================================
// BATTERIE 3: Batterie en mauvais état - Défauts critiques - NMC
// Scénario: SOH faible, défauts critiques, chimie NMC
// Résultat attendu: RECYCLE (Kill Switch activé)
// ============================================================================

CREATE (b3:Battery {
    id: 'BAT_003',
    serial_number: 'SN-NMC-2022-003',
    created_at: datetime()
})

CREATE (p3:BatteryPassport {
    // Attribute #1: State of Health (SOH)
    soh_percent: 45.0,
    
    // Attribute #2: State of Charge (SOC)
    soc_percent: 20.0,
    
    // Attribute #3: Known defects or malfunctions
    known_defects: 'Swelling detected, cell damage',
    critical_defects: true,
    
    // Attribute #4: Battery model
    battery_model: 'industrial-NMC-2022',
    model: 'industrial-NMC-2022',
    
    // Attribute #5: Battery chemistry
    chemistry: 'NMC',
    
    // Attribute #6: Date of placing on the market
    date_placing_market: '2022-03-10',
    market_date: '2022-03-10',
    
    // Attribute #7: Total energy throughput
    total_energy_throughput_kwh: 2500,
    energy_throughput: 2500,
    
    // Attribute #8: Potentials for repurposing/remanufacturing
    potentials_repurposing_remanufacturing: 'none',
    repurpose_potential: 'none',
    
    // Attribute #9: Design for disassembly
    design_for_disassembly: 'low',
    design_modularity_score: 3,
    modularity: 'low',
    
    // Attribute #10: Capacity fade
    capacity_fade_percent_per_year: 6.5,
    capacity_fade: 6.5,
    
    // Attribute #11: Informations on accidents
    accidents: 'Overheating incident in 2023',
    accident_history: 'Overheating incident in 2023',
    history_of_abuse: true,
    
    // Attribute #12: Battery Status
    battery_status: 'waste',
    status: 'waste',
    
    // Propriétés additionnelles
    capacity_nominal_kwh: 100.0,
    voltage_nominal: 800,
    manufacturer: 'IndustrialBatteryCo',
    passport_id: 'PASSPORT-NMC-003'
})

CREATE (d3:SortingDiagnosis {
    soh_percent: 45.0,
    soc_percent: 20.0,
    internal_resistance_mOhm: 85,
    known_defects: 'Swelling detected, cell damage',
    critical_defects: true,
    accidents: 'Overheating incident in 2023',
    history_of_abuse: true,
    battery_status: 'waste',
    date: datetime(),
    total_energy_throughput_kwh: 2500,
    temperature_celsius: 32,
    voltage_measured: 795.0,
    inspector: 'Inspector_003',
    notes: 'DÉFAUTS CRITIQUES: Gonflement détecté, dommages aux cellules. Historique de surchauffe. RECYCLAGE IMMÉDIAT REQUIS.'
})

CREATE (b3)-[:HAS_PASSPORT]->(p3)
CREATE (b3)-[:UNDERWENT_DIAGNOSIS]->(d3);

// ============================================================================
// BATTERIE 4: Batterie repurposée - LFP - E-bike - Seconde vie
// Scénario: SOH moyen, déjà repurposée, chimie LFP stable
// Résultat attendu: REPURPOSE (seconde vie)
// ============================================================================

CREATE (b4:Battery {
    id: 'BAT_004',
    serial_number: 'SN-LFP-2021-004',
    created_at: datetime()
})

CREATE (p4:BatteryPassport {
    // Attribute #1: State of Health (SOH)
    soh_percent: 65.0,
    
    // Attribute #2: State of Charge (SOC)
    soc_percent: 55.0,
    
    // Attribute #3: Known defects or malfunctions
    known_defects: false,
    critical_defects: false,
    
    // Attribute #4: Battery model
    battery_model: 'e-bike-LFP-2021',
    model: 'e-bike-LFP-2021',
    
    // Attribute #5: Battery chemistry
    chemistry: 'LFP',
    
    // Attribute #6: Date of placing on the market
    date_placing_market: '2021-09-05',
    market_date: '2021-09-05',
    
    // Attribute #7: Total energy throughput
    total_energy_throughput_kwh: 1200,
    energy_throughput: 1200,
    
    // Attribute #8: Potentials for repurposing/remanufacturing
    potentials_repurposing_remanufacturing: 'repurpose',
    repurpose_potential: 'repurpose',
    
    // Attribute #9: Design for disassembly
    design_for_disassembly: 'medium',
    design_modularity_score: 6,
    modularity: 'medium',
    
    // Attribute #10: Capacity fade
    capacity_fade_percent_per_year: 2.0,
    capacity_fade: 2.0,
    
    // Attribute #11: Informations on accidents
    accidents: false,
    accident_history: false,
    history_of_abuse: false,
    
    // Attribute #12: Battery Status
    battery_status: 'repurposed',
    status: 'repurposed',
    
    // Propriétés additionnelles
    capacity_nominal_kwh: 2.0,
    voltage_nominal: 48,
    manufacturer: 'BatteryCorp',
    passport_id: 'PASSPORT-LFP-004',
    previous_use: 'e-bike',
    repurpose_date: '2023-12-01',
    current_use: 'stationary_storage'
})

CREATE (d4:SortingDiagnosis {
    soh_percent: 65.0,
    soc_percent: 55.0,
    internal_resistance_mOhm: 28,
    known_defects: false,
    critical_defects: false,
    accidents: false,
    history_of_abuse: false,
    battery_status: 'repurposed',
    date: datetime(),
    total_energy_throughput_kwh: 1200,
    temperature_celsius: 23,
    voltage_measured: 47.8,
    inspector: 'Inspector_004',
    notes: 'Batterie déjà repurposée pour stockage stationnaire. État stable, adaptée pour seconde vie.'
})

CREATE (b4)-[:HAS_PASSPORT]->(p4)
CREATE (b4)-[:UNDERWENT_DIAGNOSIS]->(d4);

// ============================================================================
// BATTERIE 5 (BONUS): Batterie remanufacturée - NCA - Automobile
// Scénario: SOH bon après remanufacturing, design modulaire
// Résultat attendu: REUSE ou REMANUFACTURE
// ============================================================================

CREATE (b5:Battery {
    id: 'BAT_005',
    serial_number: 'SN-NCA-2023-005',
    created_at: datetime()
})

CREATE (p5:BatteryPassport {
    // Attribute #1: State of Health (SOH)
    soh_percent: 88.0,
    
    // Attribute #2: State of Charge (SOC)
    soc_percent: 65.0,
    
    // Attribute #3: Known defects or malfunctions
    known_defects: false,
    critical_defects: false,
    
    // Attribute #4: Battery model
    battery_model: 'automotive-NCA-2023',
    model: 'automotive-NCA-2023',
    
    // Attribute #5: Battery chemistry
    chemistry: 'NCA',
    
    // Attribute #6: Date of placing on the market
    date_placing_market: '2023-11-10',
    market_date: '2023-11-10',
    
    // Attribute #7: Total energy throughput
    total_energy_throughput_kwh: 200,
    energy_throughput: 200,
    
    // Attribute #8: Potentials for repurposing/remanufacturing
    potentials_repurposing_remanufacturing: 'remanufacture',
    repurpose_potential: 'remanufacture',
    
    // Attribute #9: Design for disassembly
    design_for_disassembly: 'high',
    design_modularity_score: 9,
    modularity: 'high',
    
    // Attribute #10: Capacity fade
    capacity_fade_percent_per_year: 1.5,
    capacity_fade: 1.5,
    
    // Attribute #11: Informations on accidents
    accidents: false,
    accident_history: false,
    history_of_abuse: false,
    
    // Attribute #12: Battery Status
    battery_status: 'remanufactured',
    status: 'remanufactured',
    
    // Propriétés additionnelles
    capacity_nominal_kwh: 75.0,
    voltage_nominal: 400,
    manufacturer: 'AutoBatteryInc',
    passport_id: 'PASSPORT-NCA-005',
    remanufacture_date: '2024-01-20',
    remanufacture_center: 'RemanufacturingCenter_01'
})

CREATE (d5:SortingDiagnosis {
    soh_percent: 88.0,
    soc_percent: 65.0,
    internal_resistance_mOhm: 26,
    known_defects: false,
    critical_defects: false,
    accidents: false,
    history_of_abuse: false,
    battery_status: 'remanufactured',
    date: datetime(),
    total_energy_throughput_kwh: 200,
    temperature_celsius: 24,
    voltage_measured: 399.2,
    inspector: 'Inspector_005',
    notes: 'Batterie récemment remanufacturée, modules remplacés. Excellent état, prête pour réutilisation.'
})

CREATE (b5)-[:HAS_PASSPORT]->(p5)
CREATE (b5)-[:UNDERWENT_DIAGNOSIS]->(d5);

// ============================================================================
// VÉRIFICATION DES DONNÉES CRÉÉES
// ============================================================================

// Compter les nœuds créés
MATCH (b:Battery) RETURN count(b) AS total_batteries;
MATCH (p:BatteryPassport) RETURN count(p) AS total_passports;
MATCH (d:SortingDiagnosis) RETURN count(d) AS total_diagnoses;
MATCH (m:MarketConfig) RETURN count(m) AS total_markets;

// Afficher un résumé des batteries
MATCH (b:Battery)-[:HAS_PASSPORT]->(p:BatteryPassport)
RETURN b.id AS battery_id, 
       p.chemistry AS chemistry, 
       p.soh_percent AS soh, 
       p.battery_status AS status,
       p.critical_defects AS critical_defects
ORDER BY b.id;

// ============================================================================
// REQUÊTES UTILES POUR TESTER L'ALGORITHME
// ============================================================================

// Récupérer le digital twin complet pour BAT_001
// MATCH (b:Battery {id: 'BAT_001'})
// OPTIONAL MATCH (b)-[:HAS_PASSPORT]->(p:BatteryPassport)
// OPTIONAL MATCH (b)-[:UNDERWENT_DIAGNOSIS]->(d:SortingDiagnosis)
// WITH b, p, d
// ORDER BY d.date DESC LIMIT 1
// MATCH (m:MarketConfig {id: 'MKT_STD_2024'})
// RETURN {
//     battery_id: b.id,
//     passport: properties(p),
//     diagnosis: properties(d),
//     market: properties(m)
// } AS digital_twin;

// ============================================================================
// FIN DU SCRIPT
// ============================================================================

