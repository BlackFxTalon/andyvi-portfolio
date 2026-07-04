import { deflateSync, inflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paethPredictor(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
}

function unfilterScanline(filter, current, previous, bytesPerPixel) {
  for (let index = 0; index < current.length; index += 1) {
    const left = index >= bytesPerPixel ? current[index - bytesPerPixel] : 0;
    const up = previous ? previous[index] : 0;
    const upLeft =
      previous && index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;

    if (filter === 1) current[index] = (current[index] + left) & 0xff;
    else if (filter === 2) current[index] = (current[index] + up) & 0xff;
    else if (filter === 3)
      current[index] = (current[index] + Math.floor((left + up) / 2)) & 0xff;
    else if (filter === 4)
      current[index] =
        (current[index] + paethPredictor(left, up, upLeft)) & 0xff;
    else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
  }
}

export function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("Not a PNG file");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8 || interlace !== 0 || ![2, 6].includes(colorType)) {
        throw new Error(
          `Unsupported PNG format bitDepth=${bitDepth} colorType=${colorType} interlace=${interlace}`,
        );
      }
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const stride = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const rgba = Buffer.alloc(width * height * 4);
  let inputOffset = 0;
  let outputOffset = 0;
  let previous = null;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const current = Buffer.from(
      inflated.subarray(inputOffset, inputOffset + stride),
    );
    inputOffset += stride;
    unfilterScanline(filter, current, previous, bytesPerPixel);

    for (let x = 0; x < width; x += 1) {
      const sourceOffset = x * bytesPerPixel;
      rgba[outputOffset] = current[sourceOffset];
      rgba[outputOffset + 1] = current[sourceOffset + 1];
      rgba[outputOffset + 2] = current[sourceOffset + 2];
      rgba[outputOffset + 3] =
        bytesPerPixel === 4 ? current[sourceOffset + 3] : 255;
      outputOffset += 4;
    }

    previous = current;
  }

  return { width, height, rgba };
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunkBuffer = Buffer.alloc(12 + data.length);
  chunkBuffer.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunkBuffer, 4);
  data.copy(chunkBuffer, 8);
  chunkBuffer.writeUInt32BE(
    crc32(Buffer.concat([typeBuffer, data])),
    8 + data.length,
  );
  return chunkBuffer;
}

export function encodePng({ width, height, rgba }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (stride + 1);
    raw[rowOffset] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      rowOffset + 1,
    );
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function comparePngBuffers(baselineBuffer, currentBuffer) {
  const baseline = decodePng(baselineBuffer);
  const current = decodePng(currentBuffer);
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const diff = Buffer.alloc(width * height * 4);
  let diffPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const outputOffset = (y * width + x) * 4;
      const inBaseline = x < baseline.width && y < baseline.height;
      const inCurrent = x < current.width && y < current.height;
      const baselineOffset = (y * baseline.width + x) * 4;
      const currentOffset = (y * current.width + x) * 4;
      const changed =
        !inBaseline ||
        !inCurrent ||
        baseline.rgba[baselineOffset] !== current.rgba[currentOffset] ||
        baseline.rgba[baselineOffset + 1] !== current.rgba[currentOffset + 1] ||
        baseline.rgba[baselineOffset + 2] !== current.rgba[currentOffset + 2] ||
        baseline.rgba[baselineOffset + 3] !== current.rgba[currentOffset + 3];

      if (changed) {
        diffPixels += 1;
        diff[outputOffset] = 255;
        diff[outputOffset + 1] = 0;
        diff[outputOffset + 2] = 96;
        diff[outputOffset + 3] = 255;
      } else {
        diff[outputOffset] = Math.round(current.rgba[currentOffset] * 0.35);
        diff[outputOffset + 1] = Math.round(
          current.rgba[currentOffset + 1] * 0.35,
        );
        diff[outputOffset + 2] = Math.round(
          current.rgba[currentOffset + 2] * 0.35,
        );
        diff[outputOffset + 3] = 255;
      }
    }
  }

  return {
    width,
    height,
    diffPixels,
    totalPixels: width * height,
    diffPixelRatio: diffPixels / (width * height),
    diffPng: encodePng({ width, height, rgba: diff }),
    dimensionMismatch:
      baseline.width !== current.width || baseline.height !== current.height,
  };
}
