// A retint of Specimen Atlas's "Topographic Lines" (geo-topographic.js) for the Work scene:
// the same contour math, drawn as ink lines on the page's own paper, no map tints.
// The page passes its colours in api.palette ({ bg, ink, accent } as 0-255 RGB) and a
// scroll value in api.drive.value (0..1), which slides the terrain so scrolling reads
// as travelling across it. The index lines near the middle pick up the accent.
(function () {
  (window.SPECIMENS = window.SPECIMENS || []).push({
    id: 'topographic-desk',
    name: 'Topographic Lines',
    family: 'Geometry',
    tags: ['webgl', 'shader', 'contours'],
    blurb: 'Contour lines on the page paper, drifting as you scroll.',
    how: 'A smooth random height field is sliced at even heights, and each slice becomes a line.',
    useFor: 'quiet backdrops that show travel',
    interact: '',
    init(host, api) {
      const cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      host.appendChild(cv);
      let gl, uni = {}, W = 1, H = 1, scale = 0.7;
      const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      const FS = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 res;uniform float time;uniform float drive;uniform vec3 bg;uniform vec3 ink;uniform vec3 accent;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
float height(vec2 p){
 vec2 q=vec2(fbm(p+vec2(3.1,time*.02)),fbm(p+vec2(5.2,1.3-time*.018)));
 return fbm(p*0.8+q*0.9);}
void main(){
 vec2 uv=gl_FragCoord.xy/res;float asp=res.x/res.y;
 vec2 p=vec2(uv.x*asp,uv.y)*1.5+vec2(drive*1.6,drive*0.35);
 float h=height(p);
 float v=h*26.;float w=fwidth(v);
 float f=abs(fract(v-.5)-.5)/max(w,1e-4);
 float line=(1.-clamp(f-.05,0.,1.))*clamp(1.5-w*2.,0.,1.);
 float idx=abs(fract(v/5.-.5)-.5)*5./max(w,1e-4);
 float iline=(1.-clamp(idx-.55,0.,1.))*clamp(1.5-w*1.5,0.,1.);
 // strongest in the middle band, where the laptop sits; fades to plain paper at the edges
 vec2 c=uv-vec2(.5,.48);float focus=exp(-dot(c*vec2(1.,1.6),c*vec2(1.,1.6))*5.);
 vec3 col=bg;
 col=mix(col,ink,line*(.035+.055*focus));
 col=mix(col,mix(ink,accent,focus*.45),iline*(.06+.11*focus));
 gl_FragColor=vec4(col,1.);
}`;
      function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
      try {
        gl = cv.getContext('webgl', { antialias: false, alpha: false });
        gl.getExtension('OES_standard_derivatives');
        const prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog); gl.useProgram(prog);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ['res', 'time', 'drive', 'bg', 'ink', 'accent'].forEach((n) => (uni[n] = gl.getUniformLocation(prog, n)));
      } catch (e) { gl = null; }
      function resize(w, h) {
        W = Math.max(1, w); H = Math.max(1, h);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        scale = W * H > 600000 ? 0.55 : 0.8;
        cv.width = Math.round(W * dpr * scale); cv.height = Math.round(H * dpr * scale);
        if (gl) gl.viewport(0, 0, cv.width, cv.height);
      }
      resize(host.clientWidth, host.clientHeight);
      const rgb = (c, d) => (c ? [c[0] / 255, c[1] / 255, c[2] / 255] : d);
      return {
        frame(t) {
          if (!gl) return;
          const pal = api.palette || {};
          const bg = rgb(pal.bg, [0.99, 0.98, 0.97]);
          cv.style.background = `rgb(${bg.map((x) => Math.round(x * 255)).join(',')})`;
          gl.uniform2f(uni.res, cv.width, cv.height);
          gl.uniform1f(uni.time, t);
          gl.uniform1f(uni.drive, (api.drive && api.drive.value) || 0);
          gl.uniform3fv(uni.bg, bg);
          gl.uniform3fv(uni.ink, rgb(pal.ink, [0.1, 0.08, 0.07]));
          gl.uniform3fv(uni.accent, rgb(pal.accent, [0.96, 0.6, 0.2]));
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        },
        resize,
        destroy() {
          try { gl && gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch (e) {}
          cv.remove();
        },
      };
    },
  });
})();
