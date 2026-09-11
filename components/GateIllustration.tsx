export function GateIllustration() {
  return <div className="fsc-gate-illustration" aria-hidden="true"><svg viewBox="0 0 600 460" fill="none">
    <defs><linearGradient id="gate-sky" x1="0" y1="0" x2="600" y2="460" gradientUnits="userSpaceOnUse"><stop stopColor="#213c5c"/><stop offset="1" stopColor="#102035"/></linearGradient><linearGradient id="gate-road" x1="310" y1="260" x2="310" y2="460" gradientUnits="userSpaceOnUse"><stop stopColor="#354c61"/><stop offset="1" stopColor="#172b42"/></linearGradient></defs>
    <rect width="600" height="460" rx="20" fill="url(#gate-sky)"/><circle cx="472" cy="98" r="43" fill="#e3eced" opacity=".85"/>
    <path d="M0 233L77 200L124 220L210 170L310 227L416 179L505 215L600 161V460H0Z" fill="#294858"/>
    <path d="M0 279L101 232L172 264L268 235L377 266L490 228L600 269V460H0Z" fill="#183d44"/>
    <path d="M263 247H347L563 460H82Z" fill="url(#gate-road)"/><path d="M305 267V308M305 334V389M305 423V460" stroke="#b4c6cd" strokeWidth="3" strokeDasharray="12 12" opacity=".65"/>
    <path d="M0 319H124V371H0M439 319H600V371H439" fill="#57717d"/>
    <path d="M123 257H162V384H123ZM433 257H472V384H433Z" fill="#adc0c6"/><path d="M132 265H153V375H132ZM442 265H463V375H442Z" fill="#819ca8"/>
    <path d="M157 279H438V360H157Z" fill="#132737" stroke="#acc4ce" strokeWidth="3"/><path d="M163 291H433M163 349H433" stroke="#678795" strokeWidth="3"/>
    {Array.from({length:18}, (_, i) => <path key={i} d={`M${171+i*15} 283V357`} stroke="#acc4ce" strokeWidth="2"/>)}
    <path d="M299 280V361" stroke="#d9e5e8" strokeWidth="4"/>
    <path d="M370 342V399" stroke="#9cb4bf" strokeWidth="7"/><rect x="353" y="316" width="34" height="45" rx="4" fill="#0a1b2e" stroke="#a6c4d3" strokeWidth="2"/><rect x="360" y="324" width="20" height="15" rx="2" fill="#589abb"/><circle cx="370" cy="349" r="3" fill="#d7e8ed"/>
    <path d="M55 283V172M57 190C19 172 16 187 11 202M57 188C83 165 101 176 111 190M55 184C41 151 53 142 62 136" stroke="#789989" strokeWidth="6" strokeLinecap="round"/><path d="M533 294V216M533 227C502 201 488 219 482 229M533 226C555 206 572 219 578 231" stroke="#6b9080" strokeWidth="5" strokeLinecap="round"/>
    <path d="M22 416H70M22 426H50M528 416H577M551 426H577" stroke="#7997a7" opacity=".4"/>
  </svg><span>Community entry, considered as a complete system.</span></div>;
}
