// Script to add all 176 missing keys to en.json with English translations
const fs = require("fs");
const path = require("path");

const enPath = path.join(__dirname, "..", "translations", "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

function setNested(obj, keyPath, value) {
  const keys = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

const missingInEn = {
  // common
  "common.yes": "Yes",
  "common.no": "No",

  // landingPricing
  "landingPricing.free.features.4": "Basic project management",
  "landingPricing.pro.features.7": "Priority technical support",

  // pricing.quotations placeholders
  "pricing.quotations.clientNamePlaceholder": "Enter client name",
  "pricing.quotations.clientCompanyPlaceholder": "Enter company name",
  "pricing.quotations.taxNumberPlaceholder": "Tax number (15 digits)",
  "pricing.quotations.addressPlaceholder": "Enter client address",
  "pricing.quotations.discountAmount": "Discount Amount",
  "pricing.quotations.taxSettings": "Tax Settings",
  "pricing.quotations.discountSettings": "Discount Settings",
  "pricing.quotations.percentage": "Percentage",
  "pricing.quotations.fixedAmount": "Fixed Amount",
  "pricing.quotations.save": "Save Quotation",
  "pricing.quotations.editComingSoon": "Edit Quotation - Coming Soon",

  // pricing.studies.structural.raft
  "pricing.studies.structural.raft.leanConcrete": "Lean Concrete",
  "pricing.studies.structural.raft.leanConcreteThickness": "Lean Concrete Thickness",
  "pricing.studies.structural.raft.edgeBeams": "Edge Beam Thickening",
  "pricing.studies.structural.raft.edgeBeamWidth": "Edge Beam Width",
  "pricing.studies.structural.raft.edgeBeamDepth": "Additional Depth",
  "pricing.studies.structural.raft.lapSplice": "Lap Splice",
  "pricing.studies.structural.raft.lapSpliceMethod": "Splice Method",
  "pricing.studies.structural.raft.lapSpliceCustom": "Custom Length",
  "pricing.studies.structural.raft.lapSpliceNote": "Bars longer than 12m - lap splice required",
  "pricing.studies.structural.raft.chairBars": "Chair Bars (Spacers)",
  "pricing.studies.structural.raft.chairDiameter": "Chair Diameter",
  "pricing.studies.structural.raft.chairSpacing": "Chair Spacing",
  "pricing.studies.structural.raft.columnDowels": "Column Dowels",
  "pricing.studies.structural.raft.columnDowelManual": "Manual Entry",
  "pricing.studies.structural.raft.columnDowelNone": "None",
  "pricing.studies.structural.raft.columnCount": "Number of Columns",
  "pricing.studies.structural.raft.barsPerColumn": "Bars/Column",
  "pricing.studies.structural.raft.developmentLength": "Development Length",
  "pricing.studies.structural.raft.coverBottom": "Bottom Cover",
  "pricing.studies.structural.raft.coverTop": "Top Cover",
  "pricing.studies.structural.raft.coverSide": "Side Cover",
  "pricing.studies.structural.raft.covers": "Concrete Covers",
  "pricing.studies.structural.raft.spliceDetails": "Splice Details",
  "pricing.studies.structural.raft.piecesPerBar": "Pieces/Bar",

  // pricing.studies.structural.strip
  "pricing.studies.structural.strip.rebarMode.stirrups": "Stirrups",
  "pricing.studies.structural.strip.rebarMode.mesh": "Mesh",
  "pricing.studies.structural.strip.advancedSettings": "Advanced Settings",
  "pricing.studies.structural.strip.intersectionDeduction": "Intersection Deduction",
  "pricing.studies.structural.strip.intersectionCount": "Number of Intersections",
  "pricing.studies.structural.strip.intersectingWidth": "Intersecting Strip Width",
  "pricing.studies.structural.strip.intersectionNote": "Concrete volume is deducted at intersection points with other strip foundations",
  "pricing.studies.structural.strip.bottomSecondary": "Secondary Bottom Reinforcement",
  "pricing.studies.structural.strip.topBars": "Top Bars",
  "pricing.studies.structural.strip.bottomMesh": "Bottom Mesh",
  "pricing.studies.structural.strip.topMesh": "Top Mesh",
  "pricing.studies.structural.strip.meshMode": "Mesh Mode",
  "pricing.studies.structural.strip.stirrupsMode": "Stirrups Mode",

  // pricing.studies.structural.slabType
  "pricing.studies.structural.slabType.label": "Slab Type",
  "pricing.studies.structural.slabType.flat": "Flat Slab",
  "pricing.studies.structural.slabType.hollow_core": "Hollow Core / Panel",
  "pricing.studies.structural.slabType.banded_beam": "Banded Beam",

  // pricing.studies.structural.blockType
  "pricing.studies.structural.blockType.label": "Block Type",
  "pricing.studies.structural.blockType.hollow": "Hollow Block",
  "pricing.studies.structural.blockType.solid": "Solid Block",
  "pricing.studies.structural.blockType.insulated": "Insulated (Sandwich)",
  "pricing.studies.structural.blockType.fire_rated": "Fire Rated",
  "pricing.studies.structural.blockType.lightweight": "Lightweight",
  "pricing.studies.structural.blockType.aac": "Autoclaved Aerated Concrete",

  // pricing.studies.structural.wallCategory
  "pricing.studies.structural.wallCategory.label": "Wall Category",
  "pricing.studies.structural.wallCategory.external": "External Wall",
  "pricing.studies.structural.wallCategory.internal": "Internal Wall",
  "pricing.studies.structural.wallCategory.partition": "Light Partition",
  "pricing.studies.structural.wallCategory.boundary": "Boundary Wall",
  "pricing.studies.structural.wallCategory.retaining": "Retaining Wall",
  "pricing.studies.structural.wallCategory.parapet": "Roof Parapet",

  // pricing.studies.finishing.cascade
  "pricing.studies.finishing.cascade.title": "Building settings updated",
  "pricing.studies.finishing.cascade.updatedItems": "Affected items ({count} items)",
  "pricing.studies.finishing.cascade.manualSkipped": "Manual items skipped: {count}",
  "pricing.studies.finishing.cascade.andMore": "and {count} more items...",
  "pricing.studies.finishing.cascade.done": "Done",

  // quantities.structural.heightDerivation
  "quantities.structural.heightDerivation.heightMode": "Height Mode",
  "quantities.structural.heightDerivation.manualHeight": "Manual Height",
  "quantities.structural.heightDerivation.levelsFromDrawings": "Levels from Drawings",
  "quantities.structural.heightDerivation.finishLevel": "Finish Level",
  "quantities.structural.heightDerivation.calculatedHeight": "Calculated Height",
  "quantities.structural.heightDerivation.excavationDepth": "Excavation Depth",
  "quantities.structural.heightDerivation.streetLevel": "Street Level",
  "quantities.structural.heightDerivation.plainConcreteThickness": "Plain Concrete Thickness",
  "quantities.structural.heightDerivation.foundationDepthLabel": "Foundation Depth",
  "quantities.structural.heightDerivation.tieBeamDepth": "Tie Beam Depth",
  "quantities.structural.heightDerivation.buildingElevation": "Building Elevation Above Street",
  "quantities.structural.heightDerivation.defaultSlabThickness": "Default Slab Thickness",
  "quantities.structural.heightDerivation.defaultBeamDepth": "Default Beam Depth",
  "quantities.structural.heightDerivation.finishThickness": "Finish Thickness",
  "quantities.structural.heightDerivation.includeFinishInLevels": "Levels Include Finish",
  "quantities.structural.heightDerivation.parapet": "Parapet",
  "quantities.structural.heightDerivation.parapetHeight": "Parapet Height",
  "quantities.structural.heightDerivation.parapetLevel": "Parapet Level",
  "quantities.structural.heightDerivation.invertedBeamDepth": "Inverted Beam Depth",
  "quantities.structural.heightDerivation.roofWaterproofing": "Roof Waterproofing Thickness",
  "quantities.structural.heightDerivation.neckHeight": "Neck Height",
  "quantities.structural.heightDerivation.autoCalculated": "Auto-calculated from levels",
  "quantities.structural.heightDerivation.derivedFromLevels": "Auto-calculated",
  "quantities.structural.heightDerivation.manualOverride": "Manual Override",
  "quantities.structural.heightDerivation.resetToAuto": "Reset to Auto",
  "quantities.structural.heightDerivation.buildingProperties": "Building Properties",
  "quantities.structural.heightDerivation.floorToFloorHeight": "Floor-to-Floor Height",
  "quantities.structural.heightDerivation.derivedColumnHeight": "Derived Column Height",
  "quantities.structural.heightDerivation.derivedBlockHeight": "Derived Block Height",
  "quantities.structural.heightDerivation.derivedNeckHeight": "Derived Neck Height",
  "quantities.structural.heightDerivation.derivedParapetHeight": "Derived Parapet Block Height",
  "quantities.structural.heightDerivation.totalBuildingHeight": "Total Building Height",
  "quantities.structural.heightDerivation.levelsMode": "Levels",

  // quantities.structural.slabType
  "quantities.structural.slabType.label": "Slab Type",
  "quantities.structural.slabType.flat": "Flat Slab",
  "quantities.structural.slabType.hollow_core": "Hollow Core / Panel",
  "quantities.structural.slabType.banded_beam": "Banded Beam",

  // quantities.structural.blockType
  "quantities.structural.blockType.label": "Block Type",
  "quantities.structural.blockType.hollow": "Hollow Block",
  "quantities.structural.blockType.solid": "Solid Block",
  "quantities.structural.blockType.insulated": "Insulated (Sandwich)",
  "quantities.structural.blockType.fire_rated": "Fire Rated",
  "quantities.structural.blockType.lightweight": "Lightweight",
  "quantities.structural.blockType.aac": "Autoclaved Aerated Concrete",

  // quantities.structural.wallCategory
  "quantities.structural.wallCategory.label": "Wall Category",
  "quantities.structural.wallCategory.external": "External Wall",
  "quantities.structural.wallCategory.internal": "Internal Wall",
  "quantities.structural.wallCategory.partition": "Light Partition",
  "quantities.structural.wallCategory.boundary": "Boundary Wall",
  "quantities.structural.wallCategory.retaining": "Retaining Wall",
  "quantities.structural.wallCategory.parapet": "Roof Parapet",

  // finance.quickActions
  "finance.quickActions.newQuotation": "New Quotation",
  "finance.quickActions.newInvoice": "New Invoice",
  "finance.quickActions.newDocument": "New Document",

  // finance.stats
  "finance.stats.quotations": "Quotations",
  "finance.stats.invoices": "Invoices",
  "finance.stats.outstanding": "Outstanding",
  "finance.stats.overdue": "Overdue",
  "finance.stats.clients": "Clients",
  "finance.stats.activeClients": "Active Client",

  // finance.overdueAlert
  "finance.overdueAlert.title": "Overdue Invoices",
  "finance.overdueAlert.description": "You have {count} overdue invoices",
  "finance.overdueAlert.viewAll": "View all overdue invoices",

  // finance top-level
  "finance.recentQuotations": "Recent Quotations",
  "finance.recentInvoices": "Recent Invoices",
  "finance.noRecentQuotations": "No recent quotations",
  "finance.noRecentInvoices": "No recent invoices",

  // finance.quotations placeholders
  "finance.quotations.clientNamePlaceholder": "Enter client name",
  "finance.quotations.clientCompanyPlaceholder": "Enter company name",
  "finance.quotations.taxNumberPlaceholder": "Tax number (15 digits)",
  "finance.quotations.addressPlaceholder": "Enter client address",
  "finance.quotations.discountAmount": "Discount Amount",
  "finance.quotations.taxSettings": "Tax Settings",
  "finance.quotations.discountSettings": "Discount Settings",
  "finance.quotations.percentage": "Percentage",
  "finance.quotations.fixedAmount": "Fixed Amount",
  "finance.quotations.save": "Save Quotation",
  "finance.quotations.editComingSoon": "Edit Quotation - Coming Soon",

  // finance.invoices coming soon
  "finance.invoices.createComingSoon": "Create Invoice - Coming Soon",
  "finance.invoices.editComingSoon": "Edit Invoice - Coming Soon",
  "finance.invoices.previewComingSoon": "Preview Invoice - Coming Soon",

  // finance.invoices.form extra
  "finance.invoices.form.discountAmount": "Discount Amount",
  "finance.invoices.form.taxSettings": "Tax Settings",
  "finance.invoices.form.discountSettings": "Discount Settings",
  "finance.invoices.form.percentage": "Percentage",
  "finance.invoices.form.fixedAmount": "Fixed Amount",
  "finance.invoices.form.terms": "Terms & Conditions",
  "finance.invoices.form.paymentTerms": "Payment Terms",
  "finance.invoices.form.deliveryTerms": "Delivery Terms",
  "finance.invoices.form.warrantyTerms": "Warranty Terms",

  // finance.documents coming soon
  "finance.documents.comingSoon": "Open Documents - Coming Soon",
  "finance.documents.createComingSoon": "Create Document - Coming Soon",
  "finance.documents.editComingSoon": "Edit Document - Coming Soon",

  // company.nav
  "company.nav.hr": "Human Resources",

  // company.hr
  "company.hr.title": "Human Resources",
  "company.hr.tabs.employees": "Employees",
  "company.hr.tabs.payroll": "Payroll",
  "company.hr.tabs.leaves": "Leaves",
  "company.hr.leaves.sections.requests": "Requests",
  "company.hr.leaves.sections.balances": "Balances",
  "company.hr.leaves.sections.types": "Leave Types",
};

for (const [key, value] of Object.entries(missingInEn)) {
  setNested(en, key, value);
}

// Sort top-level keys
const sorted = {};
for (const key of Object.keys(en).sort()) {
  sorted[key] = en[key];
}

fs.writeFileSync(enPath, JSON.stringify(sorted, null, 2) + "\n", "utf8");
console.log("Added " + Object.keys(missingInEn).length + " keys to en.json");
