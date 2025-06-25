const QRIS = require('../src/QRIS')

const staticBase = '00020101021126560012ID.GPNQR01189360091123456789020215ID20232541239390303UMI5204581253033605802ID5914RESTORASI MESJID6013JAKARTA SELATAN61051234563044E67'

describe('QRIS Utility', () => {
  it('should generate a valid QRIS string with CRC', () => {
    const qris = QRIS.generate(staticBase, 10000, 'INV-001', 'Internet Package')
    expect(qris).toMatch(/^000201.*6304[A-Z0-9]{4}$/)
  })

  it('should validate a correct QRIS string', () => {
    const qris = QRIS.generate(staticBase, 5000, 'INV-002', 'Electricity')
    expect(QRIS.validate(qris)).toBe(true)
  })

  it('should reject an invalid QRIS string (bad CRC)', () => {
    const qris = QRIS.generate(staticBase, 7000, 'INV-003', 'Mobile Data')
    const tampered = qris.slice(0, -1) + 'X' // break CRC
    expect(QRIS.validate(tampered)).toBe(false)
  })

  it('should extract readable tags from QRIS', () => {
    const qris = QRIS.generate(staticBase, 15000, 'INV-004', 'Shopping')
    const result = QRIS.extract(qris)
    console.log('🔍 Full QRIS:', qris)
    console.log('🔍 Extracted:', result)
    expect(result).toHaveProperty('Transaction Amount', '15000.00')
    expect(result).toHaveProperty('Additional Data')
    expect(result['Payload Format Indicator']).toBe('01')
    expect(result['Additional Data']['Invoice Number']).toBe('INV-004')
    expect(result['Additional Data']['Description']).toBe('Shopping')
  })

  it('should throw error for QRIS without 6304', () => {
    const badBase = staticBase.replace('6304', '')
    expect(() => QRIS.generate(badBase, 10000)).toThrow('CRC tag "6304" not found')
  })
})