import LogoMark from '@/components/icons/LogoMark';
import s from './TransitOverlay.module.css';

/** The small "page is on its way" screen: logo, a travelling line and the destination's name. */
export default function TransitOverlay({ on, label }: { on: boolean; label: string }) {
  return (
    <div className={`${s.transit} ${on ? s.on : ''}`} aria-hidden="true">
      <div className={s.lg}>
        <LogoMark />
      </div>
      <div className={s.ln}>
        <i />
      </div>
      <div className={s.to}>{label}</div>
    </div>
  );
}
