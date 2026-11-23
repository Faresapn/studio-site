// Extracted from reference/prototype.html by scripts/extract-images.mjs. Do not edit by hand.
import type { SVGProps } from 'react';

export default function LogoMark({ title = 'Logo placeholder', ...rest }: SVGProps<SVGSVGElement> & { title?: string }) {
  const props = { xmlns: 'http://www.w3.org/2000/svg', fill: 'currentColor', role: 'img', 'aria-label': title, ...rest };
  return (
    <svg {...props} viewBox="37 56 1205 476" ><text x="640" y="395" textAnchor="middle" fontFamily="Inter,system-ui,sans-serif" fontWeight="600" fontSize="300" letterSpacing="-8">LOGO</text></svg>
  );
}
