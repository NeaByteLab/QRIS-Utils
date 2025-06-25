# QRIS Utility

A lightweight utility to **generate**, **validate**, and **extract** QRIS-compliant payment strings. Built with full support for EMVCo TLV formatting and CRC16 validation.

## 📦 Features
- Generate dynamic QRIS with amount, invoice, and description
- Validate QRIS strings against CRC checksum
- Extract and parse readable tag values (nested TLV aware)
- Fully compatible with all static QRIS base strings

## 📥 Installation
```bash
git clone https://github.com/NeaByteLab/QRIS-Utils.git
cd QRIS-Utils
npm install
```

## 🚀 Usage
```js
const QRIS = require('./src/QRIS')

const staticBase = '00020101021126...6304' // your static QR base

// Generate dynamic QRIS string
const qris = QRIS.generate(staticBase, 10000, 'INV-001', 'Internet Package')
console.log('QRIS:', qris)

// Validate
console.log('Is Valid?', QRIS.validate(qris))

// Extract readable tags
console.log('Extracted:', QRIS.extract(qris))
```

## 🧪 Testing
```bash
npm test
```
Output:
```
✓ should generate a valid QRIS string with CRC
✓ should validate a correct QRIS string
✓ should reject an invalid QRIS string (bad CRC)
✓ should extract readable tags from QRIS
✓ should throw error for QRIS without 6304
```

## 📂 Project Structure
```
.
├── example.js              # Sample usage
├── src/QRIS.js             # Core utility module
├── test/QRIS.test.js       # Jest test suite
├── package.json            # Metadata
└── README.md               # Documentation
```

## 📚 Supported Tags (Extract)
- `00`: Payload Format Indicator
- `01`: Point of Initiation Method
- `26-51`: Merchant Account Info (ID specific)
- `52`: Merchant Category Code
- `53`: Transaction Currency
- `54`: Transaction Amount
- `58-61`: Country, Merchant Info
- `62`: Additional Data (Invoice, Description)
- `63`: CRC Checksum

## 📄 License
MIT License © 2025 NeaByteLab