import '../styles/alpine.css';
import '../styles/panels.css';
import '../styles/journey.css';
import '../styles/hub.css';
import HubExperience from './HubExperience.jsx';
import ChatWidget from '../ChatWidget.jsx';
import { isEmbedded, switchMode } from '../mode.js';

// the page's default browser-chrome colour is the classic site's paper; this mode is night
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0e1524');

// The 3D basecamp and its stylesheets, loaded only when this mode is chosen.
// Inside the classic site's window it drops what the host page already has:
// the way back to the classic site, and the chat.
export default function InteractiveMode() {
  const embedded = isEmbedded();
  return (
    <>
      <HubExperience onClassic={embedded ? undefined : () => switchMode('classic')} />
      {!embedded && <ChatWidget />}
    </>
  );
}
