# Visual Asset & Specimen Credits

## Synthetic Specimen Portrait (`/public/specimen.jpg`)

- **Subject Type**: Fully synthetic AI-generated persona (not a real human, minor, celebrity, or public figure).
- **Generation Method**: Synthetically generated via Imagen diffusion model with a custom prompt specified for documentary-style environmental half-length portraiture under soft window daylight.
- **Model Release / License**: Fully synthetic output generated specifically for Haven's digital forensics specimen demonstration. No living person's likeness or identifiable individual was captured or replicated.
- **Forensic Tampering / Modifications**:
  - In strict compliance with safety guidelines, **NO alteration has been made to the person's face, body, or expression**.
  - Forensic indicators were introduced **exclusively to background environmental objects**: specifically, cloning and resampling of the background wall frame (`x: 870..1055, y: 335..513`) to serve as a realistic, verifiable specimen anomaly for Error Level Analysis (ELA), luminance noise variance, and region comparison.
  - Graded toward Haven's warm moss-and-slate duotone palette (`#0A120D` shadows, `#3C4E42` midtones, `#E0E7E2` highlights) to integrate with the workspace identity.

## Supporting Documentary Imagery (`/public/supporting-phone-night.jpg`)

- **Subject Type**: Fully synthetic documentary close-up of a person's hands holding a smartphone displaying an incoming file at a wooden desk at night under warm lamp light.
- **Generation Method**: Synthetically generated via Imagen diffusion model with a custom prompt for authentic 35mm editorial documentary photography.
- **License**: Custom synthetic asset created for Haven. No real individuals, personal communications, or brands depicted.

## Forensic Derivative Assets

1. **`specimen.jpg`**: Primary documentary specimen photograph (JPEG quality 88).
2. **`specimen-ela.jpg`**: Error Level Analysis (ELA) map amplifying compression artifact variance (18x scale) between original and re-quantized 95% JPEG encoding.
3. **`specimen-noise.jpg`**: High-frequency luminance sensor noise distribution map highlighting surface inconsistency.
4. **`specimen-crop-suspect.jpg`**: Magnified 4x inspection crop centered on the background cloned anomaly (`x: 850..1070, y: 320..520`).
5. **`specimen-crop-ref.jpg`**: Reference crop of the original unedited wall photograph (`x: 860..1080, y: 20..220`).
6. **`specimen-crop-desk.jpg`**: Supporting room context exhibit showing wooden desk, stationery, and ambient room details.
7. **`supporting-phone-night.jpg`**: Supporting documentary context exhibit for Exhibit A received message.
