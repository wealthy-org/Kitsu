// Builds public/share/shiba.png: the About-section shiba artwork with its flat navy background keyed
// out, so the share card can composite it over the hero background. Self-contained (no third-party
// asset): the source is the project's own public/course-preview/kitsu-ready.webp.
// Run with: node scripts/generate-share-character.mjs
import { writeFileSync } from 'node:fs'
import sharp from 'sharp'

const SOURCE = 'public/course-preview/kitsu-ready.webp'
const TARGET = 'public/share/shiba.png'
const ALPHA_FLOOR = 16
const ALPHA_CEILING = 44
const CROP_PADDING = 8
// The source artwork was captured with the Next.js dev badge in its bottom-left corner; the dog
// sits well right of it, so the left strip is dropped before keying.
const SOURCE_GUARD_LEFT = 200

const metadata = await sharp(SOURCE).metadata()
const width = metadata.width
const height = metadata.height

const cropped = await sharp(SOURCE)
  .extract({ left: SOURCE_GUARD_LEFT, top: 0, width: width - SOURCE_GUARD_LEFT, height })
  .raw()
  .toBuffer({ resolveWithObject: true })

const keyWidth = cropped.info.width
const keyHeight = cropped.info.height

// WebP decodes without an alpha channel, so build an explicit RGBA plane to key against.
const data = Buffer.alloc(keyWidth * keyHeight * 4)
for (let pixel = 0; pixel < keyWidth * keyHeight; pixel += 1) {
  const from = pixel * cropped.info.channels
  const to = pixel * 4
  data[to] = cropped.data[from]
  data[to + 1] = cropped.data[from + 1]
  data[to + 2] = cropped.data[from + 2]
  data[to + 3] = 255
}

const background = [0, 0, 0]
const corners = [0, keyWidth - 1, (keyHeight - 1) * keyWidth, keyHeight * keyWidth - 1]
for (const corner of corners) {
  background[0] += data[corner * 4] / corners.length
  background[1] += data[corner * 4 + 1] / corners.length
  background[2] += data[corner * 4 + 2] / corners.length
}

let minX = keyWidth
let minY = keyHeight
let maxX = 0
let maxY = 0

for (let y = 0; y < keyHeight; y += 1) {
  for (let x = 0; x < keyWidth; x += 1) {
    const index = (y * keyWidth + x) * 4
    const distance = Math.max(
      Math.abs(data[index] - background[0]),
      Math.abs(data[index + 1] - background[1]),
      Math.abs(data[index + 2] - background[2]),
    )
    let alpha = 255
    if (distance < ALPHA_FLOOR) {
      alpha = 0
    } else if (distance < ALPHA_CEILING) {
      alpha = Math.round(((distance - ALPHA_FLOOR) / (ALPHA_CEILING - ALPHA_FLOOR)) * 255)
    }
    data[index + 3] = alpha
    if (alpha > 40) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
}

const left = Math.max(0, minX - CROP_PADDING)
const top = Math.max(0, minY - CROP_PADDING)
const cropWidth = Math.min(keyWidth - left, maxX - minX + 1 + CROP_PADDING * 2)
const cropHeight = Math.min(keyHeight - top, maxY - minY + 1 + CROP_PADDING * 2)

const output = await sharp(data, { raw: { width: keyWidth, height: keyHeight, channels: 4 } })
  .extract({ left, top, width: cropWidth, height: cropHeight })
  .png()
  .toBuffer()

writeFileSync(TARGET, output)
console.log(`wrote ${TARGET} (${cropWidth}x${cropHeight}, ${output.length} bytes)`)
