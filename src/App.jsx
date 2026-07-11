import { getEngine } from './journey/engine/index.js';
import { REDUCED_MOTION } from './journey/hooks.js';
import AlpineJourney from './journey/AlpineJourney.jsx';
import FallbackSite from './sections/FallbackSite.jsx';
import ChatWidget from './ChatWidget.jsx';

export default function App() {
  const engineOk = !!getEngine().WorldRuntime;
  // `?flat` forces the clean static site (also handy for accessibility / sharing).
  const forceFlat =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('flat');
  // The cinematic walk needs motion; a reduced-motion visitor (or a browser
  // where the engine failed to load) gets the clean static site instead.
  const useJourney = engineOk && !REDUCED_MOTION && !forceFlat;

  return (
    <>
      {useJourney ? <AlpineJourney /> : <FallbackSite />}
      <ChatWidget />
    </>
  );
}
