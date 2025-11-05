# Tajawal Font Setup for PDF Generation

This project requires the **Tajawal-Regular.ttf** font file for proper Arabic PDF generation.

## Installation Steps:

1. Download Tajawal font from Google Fonts:
   https://fonts.google.com/specimen/Tajawal

2. Download the "Regular 400" weight TTF file

3. Rename it to: `Tajawal-Regular.ttf`

4. Place it in this directory: `/public/fonts/Tajawal-Regular.ttf`

## Verification:

Once the font is added, the PDF generator in `src/lib/pdfGenerator.ts` will automatically load and use it for all Arabic text rendering.

The file path should be: `/public/fonts/Tajawal-Regular.ttf`

## Alternative:

If you cannot add the font file, the PDF will fall back to using Helvetica, but Arabic text may not display correctly.
