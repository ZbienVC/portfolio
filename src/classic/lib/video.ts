/**
 * Demo clips ship as H.264 MP4 (every major browser) with a VP9 WebM copy for
 * browsers built without H.264. If neither plays, the page shows the still.
 */
let cached: boolean | null = null;
export function canPlayClips() {
  if (cached === null) {
    const v = document.createElement('video');
    cached = v.canPlayType('video/mp4; codecs="avc1.640028"') !== '' || v.canPlayType('video/webm; codecs="vp9"') !== '';
  }
  return cached;
}
