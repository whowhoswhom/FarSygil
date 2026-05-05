const SVG_SIZE = 200;
const SVG_PADDING_RATIO = 0.1;

export function decodePolyline(polyline: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= polyline.length);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= polyline.length);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    points.push([latitude / 1e5, longitude / 1e5]);
  }

  return points;
}

export function buildNormalizedRoutePath(
  polyline: string | null | undefined,
): string | null {
  if (!polyline) {
    return null;
  }

  let points: [number, number][];

  try {
    points = decodePolyline(polyline);
  } catch {
    return null;
  }

  if (points.length < 2) {
    return null;
  }

  const latitudes = points.map(([latitude]) => latitude);
  const longitudes = points.map(([, longitude]) => longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const width = Math.max(maxLongitude - minLongitude, Number.EPSILON);
  const height = Math.max(maxLatitude - minLatitude, Number.EPSILON);
  const usableSize = SVG_SIZE * (1 - SVG_PADDING_RATIO * 2);
  const scale = usableSize / Math.max(width, height);
  const offsetX = (SVG_SIZE - width * scale) / 2;
  const offsetY = (SVG_SIZE - height * scale) / 2;

  return points
    .map(([latitude, longitude], index) => {
      const x = (longitude - minLongitude) * scale + offsetX;
      const y = (maxLatitude - latitude) * scale + offsetY;
      const prefix = index === 0 ? "M" : "L";

      return `${prefix}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
