import exifr from "exifr";

const AI_SOFTWARE_SIGNATURES = [
  { pattern: /midjourney/i, label: "Midjourney" },
  { pattern: /stable diffusion|stability ai/i, label: "Stable Diffusion" },
  { pattern: /dall[-\s]?e|openai/i, label: "DALL-E" },
  { pattern: /\bflux\b/i, label: "Flux" },
  { pattern: /firefly|adobe firefly/i, label: "Adobe Firefly" },
  { pattern: /comfyui|automatic1111|novelai|leonardo|ideogram|playground/i, label: "AI generator" },
];

const EXIF_FIELDS = [
  "Make",
  "Model",
  "Software",
  "CreatorTool",
  "DateTimeOriginal",
  "CreateDate",
  "ModifyDate",
  "GPSLatitude",
  "GPSLongitude",
  "Artist",
  "HostComputer",
  "LensModel",
  "ExposureTime",
  "FNumber",
  "ISO",
];

const collectStringValues = (obj, depth = 0) => {
  if (depth > 4 || obj == null) return [];
  if (typeof obj === "string") return [obj];
  if (typeof obj !== "object") return [];
  return Object.values(obj).flatMap((v) => collectStringValues(v, depth + 1));
};

const detectAiSoftware = (exif, xmp = {}) => {
  const haystack = collectStringValues({ ...exif, ...xmp }).join(" ");
  const detected = [];
  for (const { pattern, label } of AI_SOFTWARE_SIGNATURES) {
    if (pattern.test(haystack) && !detected.includes(label)) {
      detected.push(label);
    }
  }
  return detected;
};

const detectTimestampAnomalies = (exif) => {
  const anomalies = [];
  const created = exif.DateTimeOriginal || exif.CreateDate;
  const modified = exif.ModifyDate;

  if (!created && !modified && Object.keys(exif).length > 0) {
    anomalies.push("Missing creation timestamp in otherwise present metadata");
  }

  if (created && modified) {
    const createMs = new Date(created).getTime();
    const modifyMs = new Date(modified).getTime();
    if (!Number.isNaN(createMs) && !Number.isNaN(modifyMs) && modifyMs < createMs) {
      anomalies.push("Modify date precedes creation date");
    }
  }

  const now = Date.now();
  if (created) {
    const createMs = new Date(created).getTime();
    if (!Number.isNaN(createMs) && createMs > now + 86_400_000) {
      anomalies.push("Creation timestamp is in the future");
    }
  }

  return anomalies;
};

const assessMetadataIntegrity = ({ hasExif, metadataStripped, aiSoftwareSignatures, timestampAnomalies, editingSoftware }) => {
  if (metadataStripped || !hasExif) return "stripped";
  if (aiSoftwareSignatures.length > 0 || editingSoftware || timestampAnomalies.length > 0) {
    return "suspicious";
  }
  return "intact";
};

export const analyzeImageMetadata = async (imageBuffer) => {
  let exif = {};
  let xmp = {};

  try {
    exif = (await exifr.parse(imageBuffer, { pick: EXIF_FIELDS })) || {};
  } catch {
    exif = {};
  }

  try {
    xmp = (await exifr.parse(imageBuffer, { xmp: true })) || {};
  } catch {
    xmp = {};
  }

  const hasExif = Object.keys(exif).length > 0 || Object.keys(xmp).length > 0;
  const creationSoftware = exif.Software || exif.CreatorTool || xmp.CreatorTool || null;
  const editingSoftware =
    creationSoftware &&
    /photoshop|lightroom|gimp|snapseed|pixelmator|affinity|canva/i.test(creationSoftware)
      ? creationSoftware
      : null;

  const cameraModel =
    exif.Make && exif.Model
      ? `${exif.Make} ${exif.Model}`.trim()
      : exif.Model || null;

  const deviceInfo = exif.HostComputer || exif.Artist || null;
  const gpsPresent = Boolean(exif.GPSLatitude && exif.GPSLongitude);
  const aiSoftwareSignatures = detectAiSoftware(exif, xmp);
  const timestampAnomalies = detectTimestampAnomalies(exif);

  const metadataStripped = !hasExif;
  const missingMetadata = !hasExif;

  const findings = [];
  if (missingMetadata) findings.push("No EXIF/XMP metadata found — common for AI-generated or re-exported images");
  if (aiSoftwareSignatures.length > 0) {
    findings.push(`AI software signatures detected: ${aiSoftwareSignatures.join(", ")}`);
  }
  if (editingSoftware) findings.push(`Editing software detected: ${editingSoftware}`);
  if (timestampAnomalies.length > 0) {
    findings.push(...timestampAnomalies.map((a) => `Timestamp anomaly: ${a}`));
  }
  if (gpsPresent) findings.push("GPS location metadata present");

  const metadataIntegrity = assessMetadataIntegrity({
    hasExif,
    metadataStripped,
    aiSoftwareSignatures,
    timestampAnomalies,
    editingSoftware,
  });

  return {
    hasExif,
    missingMetadata,
    metadataStripped,
    metadataIntegrity,
    cameraModel,
    creationSoftware,
    editingSoftware,
    deviceInfo,
    gpsPresent,
    timestampAnomalies,
    aiSoftwareSignatures,
    suspiciousEditingHistory: editingSoftware ? [editingSoftware] : [],
    findings,
    rawExif: {
      make: exif.Make || null,
      model: exif.Model || null,
      software: creationSoftware,
      dateTimeOriginal: exif.DateTimeOriginal || exif.CreateDate || null,
      modifyDate: exif.ModifyDate || null,
      lensModel: exif.LensModel || null,
      iso: exif.ISO || null,
    },
  };
};

export default { analyzeImageMetadata };
