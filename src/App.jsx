import { REDUCED_MOTION, hasWebGL } from './journey/hooks.js';
import HubExperience from './hub/HubExperience.jsx';
import FallbackSite from './sections/FallbackSite.jsx';
import ChatWidget from './ChatWidget.jsx';

export default function App() {
  // `?flat` forces the clean static site (also handy for accessibility / sharing).
  const forceFlat =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('flat');
  // The 3D hub needs WebGL and motion; otherwise serve the clean static site.
  const useHub = hasWebGL() && !REDUCED_MOTION && !forceFlat;

  return (
    <>
      {useHub ? <HubExperience /> : <FallbackSite />}
      <ChatWidget />
    </>
  );
}
