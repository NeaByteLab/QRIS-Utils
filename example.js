const QRIS = require('./src/QRIS')

const staticBase = '00020101021126560012ID.GPNQR01189360091123456789020215ID20232541239390303UMI5204581253033605802ID5914RESTORASI MESJID6013JAKARTA SELATAN61051234563044E67'

// Generate QRIS
const qris = QRIS.generate(staticBase, 10000, 'INV-001', 'Internet Package')
console.log('QRIS:', qris)

// Validate QRIS
console.log('Is Valid?', QRIS.validate(qris)) // true

// Extract readable values
console.log('Extracted QRIS:', QRIS.extract(qris))