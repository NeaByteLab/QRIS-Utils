/**
 * QRIS Utility
 * 
 * Generate, validate, and extract tag values from a QRIS-compliant string.
 * Fully follows EMVCo + QRIS specification, including CRC16-CCITT.
 */
class QRIS {
  /**
   * Generates a formatted EMV tag: ID + length (2 digits) + value.
   * @param {string} id - Tag identifier (e.g., '01', '54')
   * @param {string} value - Value of the tag
   * @returns {string} Formatted tag string
   */
  static generateTag(id, value) {
    const length = value.length.toString().padStart(2, '0')
    return `${id}${length}${value}`
  }

  /**
   * Calculates CRC16-CCITT-FALSE checksum.
   * Polynomial: 0x1021, Initial value: 0xFFFF
   * @param {string} data - QRIS string without the CRC value
   * @returns {string} 4-character uppercase hexadecimal CRC
   */
  static calculateCRC16(data) {
    let crc = 0xFFFF
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1
        crc &= 0xFFFF
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0')
  }

  /**
   * Parses EMV TLV-formatted string recursively.
   * @param {string} data - TLV string to parse
   * @returns {Object} Parsed object of tag-value pairs
   */
  static parseTLV(data, recurseTags = []) {
    const result = {}
    let i = 0
    while (i + 4 <= data.length) {
      const id = data.slice(i, i + 2)
      const len = parseInt(data.slice(i + 2, i + 4), 10)
      const value = data.slice(i + 4, i + 4 + len)
      if (isNaN(len) || i + 4 + len > data.length) {
        break
      }
      if (recurseTags.includes(id)) {
        result[id] = this.parseTLV(value, recurseTags)
      } else {
        result[id] = value
      }
      i += 4 + len
    }
    return result
  }

  /**
   * Generates a dynamic QRIS string with amount, optional invoice and description.
   * Works for any static QRIS base ending with 6304.
   * @param {string} dataQris - Static base QRIS (must include "6304")
   * @param {number|string} dataAmount - Amount (formatted as decimal)
   * @param {string} [dataInvoice=''] - Optional invoice/reference ID
   * @param {string} [dataDescription=''] - Optional transaction description
   * @returns {string} Final dynamic QRIS string with CRC
   */
  static generate(dataQris, dataAmount, dataInvoice = '', dataDescription = '') {
    if (!(dataQris.includes('6304'))) {
      throw new Error('Invalid QRIS base: CRC tag "6304" not found')
    }
    const baseQR = dataQris.slice(0, dataQris.indexOf('6304'))
    const tlv = this.parseTLV(baseQR)
    tlv['54'] = Number(dataAmount).toFixed(2)
    if (dataInvoice || dataDescription) {
      const addData = {}
      if (dataInvoice) addData['01'] = dataInvoice
      if (dataDescription) addData['07'] = dataDescription
      tlv['62'] = addData
    }
    const rebuild = (obj) => {
      return Object.keys(obj)
        .sort().map((id) => {
          const val = obj[id]
          if (typeof val === 'object') return this.generateTag(id, rebuild(val))
          return this.generateTag(id, val)
        }).join('')
    }
    const qrWithoutCRC = rebuild(tlv) + '6304'
    const crc = this.calculateCRC16(qrWithoutCRC)
    return qrWithoutCRC + crc
  }

  /**
   * Validates whether a QRIS string has a correct CRC.
   * @param {string} qrString - Full QRIS string including CRC tag
   * @returns {boolean} True if CRC is correct, false otherwise
   */
  static validate(qrString) {
    const index = qrString.indexOf('6304')
    if (index === -1 || qrString.length < index + 8) {
      return false
    }
    const withoutCRC = qrString.slice(0, index + 4)
    const expectedCRC = qrString.slice(index + 4, index + 8)
    const calculatedCRC = this.calculateCRC16(withoutCRC)
    return expectedCRC === calculatedCRC
  }

  /**
   * Extracts and maps QRIS tags to human-readable names with recursive parsing.
   * @param {string} qrString - Full QRIS string
   * @returns {Object} Mapped tag names with values
   */
  static extract(qrString) {
    const tagMap = {
      '00': 'Payload Format Indicator',
      '01': 'Point of Initiation Method',
      '26': 'Merchant Account Info (26)',
      '27': 'Merchant Account Info (27)',
      '28': 'Merchant Account Info (28)',
      '29': 'Merchant Account Info (29)',
      '30': 'Merchant Account Info (30)',
      '31': 'Merchant Account Info (31)',
      '32': 'Merchant Account Info (32)',
      '33': 'Merchant Account Info (33)',
      '34': 'Merchant Account Info (34)',
      '35': 'Merchant Account Info (35)',
      '36': 'Merchant Account Info (36)',
      '37': 'Merchant Account Info (37)',
      '38': 'Merchant Account Info (38)',
      '39': 'Merchant Account Info (39)',
      '40': 'Merchant Account Info (40)',
      '41': 'Merchant Account Info (41)',
      '42': 'Merchant Account Info (42)',
      '43': 'Merchant Account Info (43)',
      '44': 'Merchant Account Info (44)',
      '45': 'Merchant Account Info (45)',
      '46': 'Merchant Account Info (46)',
      '47': 'Merchant Account Info (47)',
      '48': 'Merchant Account Info (48)',
      '49': 'Merchant Account Info (49)',
      '50': 'Merchant Account Info (50)',
      '51': 'Merchant Account Info (51)',
      '52': 'Merchant Category Code',
      '53': 'Transaction Currency',
      '54': 'Transaction Amount',
      '55': 'Tip or Convenience Indicator',
      '56': 'Value of Convenience Fee Fixed',
      '57': 'Value of Convenience Fee Percentage',
      '58': 'Country Code',
      '59': 'Merchant Name',
      '60': 'Merchant City',
      '61': 'Postal Code',
      '62': 'Additional Data',
      '63': 'CRC'
    }

    const recurseTags = ['62']
    const raw = this.parseTLV(qrString, recurseTags)
    delete raw['63']
    const result = {}
    for (const [key, val] of Object.entries(raw)) {
      const label = tagMap[key] || `Tag ${key}`
      if (typeof val === 'object') {
        const nested = {}
        for (const [subKey, subVal] of Object.entries(val)) {
          const subLabel = {
            '00': 'Global Unique ID',
            '01': 'Invoice Number',
            '07': 'Description'
          }[subKey] || `Tag ${subKey}`
          nested[subLabel] = subVal
        }
        result[label] = nested
      } else {
        result[label] = val
      }
    }

    return result
  }
}

/**
 * Export Modules
 */
module.exports = QRIS