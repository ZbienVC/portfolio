(window.SPECIMENS = window.SPECIMENS || []).push({
  id: 'print-risograph',
  name: 'Risograph Print',
  family: 'Print',
  tags: ['webgl', 'risograph', 'spot color', 'grain'],
  blurb: 'A loud little poster pulled off a risograph, with fluorescent pink, blue and yellow inks that never quite line up. The grainy, slightly off look is the whole charm.',
  how: 'Each ink is its own grayscale layer printed with grainy noise instead of solid fill, then nudged out of place to fake misregistration, which is when print layers slip against each other. The layers multiply on textured paper, so overlaps make new colors like purple and orange.',
  useFor: 'zine-style landing pages, event posters, playful brand illustrations',
  interact: 'Move to push the inks out of register, click to swap the ink set',
  init(host, api) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#f4efe4';
    host.appendChild(canvas);
    let gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false }); } catch (e) {}
    if (!gl) return { frame() {}, resize() {}, destroy() { canvas.remove(); } };
    const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const FS1 = `precision highp float;
uniform vec2 uRes;uniform float uT;uniform vec2 uOff;uniform vec3 uI0;uniform vec3 uI1;uniform vec3 uI2;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.1+3.3;a*=.5;}return v;}
float sdCircle(vec2 p,float r){return length(p)-r;}
float sdBox(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float fill(float d,float aa){return 1.-smoothstep(-aa,aa,d);}
// returns ink densities (pink, blue, yellow)
vec3 scene(vec2 p,float T){
  float aa=1.5/uRes.y;
  vec3 d=vec3(0.);
  // big gradient sun (yellow) with stripes
  vec2 sp=p-vec2(-.32+.05*sin(T*.4),.12);
  float sun=fill(sdCircle(sp,.38),aa);
  d.z+=sun*(.55+.45*smoothstep(-.4,.4,-sp.y));
  // pink stripes over the sun
  float stripes=step(.5,fract((sp.y+T*.04)*9.));
  d.x+=sun*stripes*smoothstep(.0,-.35,sp.y)*.9;
  // blue wave field
  float wv=p.y+.18+.06*sin(p.x*5.+T*.9)+.035*sin(p.x*13.-T*1.3);
  d.y+=(1.-smoothstep(-aa,aa,wv))*(.65+.35*smoothstep(-.1,-.6,p.y));
  float wv2=p.y+.33+.05*sin(p.x*7.-T*1.1+1.);
  d.x+=(1.-smoothstep(-aa,aa,wv2))*.7;
  // figure: rotating flower of circles (pink + blue overlap)
  vec2 fp=p-vec2(.42,.05+.03*sin(T*.7));
  for(int i=0;i<6;i++){float a=float(i)/6.*6.2832+T*.35;
    vec2 q=fp-vec2(cos(a),sin(a))*.15;
    float c=fill(sdCircle(q,.12),aa);
    if(mod(float(i),2.)<.5)d.x+=c*.85;else d.y+=c*.8;}
  d.z+=fill(sdCircle(fp,.08),aa);
  // tilted rectangle
  vec2 rp=rot(.4+.15*sin(T*.3))*(p-vec2(.05,-.02));
  d.y+=fill(sdBox(rp,vec2(.05,.32)),aa)*.75;
  // halftone-like gradient ball top right
  vec2 bp=p-vec2(.75,.33);
  float ball=fill(sdCircle(bp,.13),aa);
  d.x+=ball*smoothstep(.15,-.15,bp.x+bp.y)*1.;
  d.z+=ball*.7;
  // dotted grid of small dots (blue) on the left
  vec2 gp=p-vec2(-.78,-.05);
  vec2 cell=fract(gp*14.)-.5;vec2 id=floor(gp*14.);
  float inG=step(abs(gp.x),.18)*step(abs(gp.y+.0),.36);
  float rr=.18+.17*sin(id.y*.6+T*1.5);
  d.y+=inG*fill(length(cell)-rr,.05)*.9;
  return clamp(d,0.,1.);
}
void main(){vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;gl_FragColor=vec4(scene(p,uT),1.);}`;
    const FS2 = `precision highp float;
uniform vec2 uRes;uniform float uT;uniform vec2 uOff;uniform vec3 uI0;uniform vec3 uI1;uniform vec3 uI2;uniform sampler2D uSrc;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float grain(vec2 fc,float dens,float seed){
  float n=hash(floor(fc)+seed*17.)*.55+noise(fc*.35+seed*5.)*.5;
  float clump=noise(fc*.02+seed*3.)*.3;
  float th=dens*1.1+clump-.15;
  return smoothstep(n-.07,n+.07,th);
}
void main(){
  vec2 fc=gl_FragCoord.xy;
  vec2 uv=fc/uRes;vec2 px=1./uRes;vec2 o=uOff;
  float dp=texture2D(uSrc,uv+o*vec2(1.,.3)*px).x;
  float db=texture2D(uSrc,uv+o*vec2(-.6,.8)*px).y;
  float dy=texture2D(uSrc,uv+o*vec2(-.3,-1.)*px).z;
  float g=max(1.,uRes.y/520.);
  vec2 gc=fc/g;
  float ink=.88+.12*noise(fc*.006+1.);
  float ip=grain(gc,dp,1.)*ink;
  float ib=grain(gc,db,2.)*(.88+.12*noise(fc*.006+7.));
  float iy=grain(gc,dy,3.)*.95;
  float streak=.94+.06*noise(vec2(fc.x*.02,fc.y*.0015));
  vec3 paper=vec3(.965,.945,.9)-hash(fc*.37)*.035-noise(fc*vec2(.05,.012))*.04;
  vec3 col=paper;
  col*=mix(vec3(1.),uI2,iy*streak);
  col*=mix(vec3(1.),uI0,ip*streak);
  col*=mix(vec3(1.),uI1,ib*streak);
  col*=1.-step(.9985,hash(floor(fc/1.5)))*.5;
  col*=.93+.07*smoothstep(0.,.25,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
  gl_FragColor=vec4(col,1.);
}`;
    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    function prog(fs) { const P = gl.createProgram(); gl.attachShader(P, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(P, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(P, 0, 'p'); gl.linkProgram(P); if (!gl.getProgramParameter(P, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(P)); return P; }
    let P1, P;
    try { P1 = prog(FS1); P = prog(FS2); }
    catch (e) { console.warn('riso', e); return { frame() {}, resize() {}, destroy() { canvas.remove(); } }; }
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(P, n);
    const u = { res: U('uRes'), t: U('uT'), off: U('uOff'), i0: U('uI0'), i1: U('uI1'), i2: U('uI2'), src: U('uSrc') };
    const u1 = { res: gl.getUniformLocation(P1, 'uRes'), t: gl.getUniformLocation(P1, 'uT') };
    const tex = gl.createTexture(), fbo = gl.createFramebuffer(); let SW = 1, SH = 1;
    // multiply colors: fluoro pink, medium blue, yellow
    const sets = [
      [[1.0, 0.28, 0.6], [0.0, 0.47, 0.75], [1.0, 0.91, 0.0]],
      [[1.0, 0.42, 0.33], [0.24, 0.27, 0.62], [0.0, 0.66, 0.53]],
      [[0.98, 0.33, 0.73], [0.38, 0.27, 0.71], [1.0, 0.72, 0.1]]
    ];
    let si = 0, W = 1, H = 1, ox = 4, oy = 3;
    function resize(w, h) {
      W = Math.max(2, Math.round(w * dpr)); H = Math.max(2, Math.round(h * dpr)); canvas.width = W; canvas.height = H;
      SW = Math.max(2, Math.round(W / 2)); SH = Math.max(2, Math.round(H / 2));
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SW, SH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    resize(host.clientWidth, host.clientHeight);
    api.onClick(() => { si = (si + 1) % sets.length; });
    return {
      frame(t) {
        try {
          const pt = api.pointer;
          const base = Math.max(3, H / 140);
          const tx = (pt.inside ? (pt.nx - 0.5) * 2 : Math.sin(t * 0.5) * 0.4) * base * 4 + base;
          const ty = (pt.inside ? (0.5 - pt.ny) * 2 : Math.cos(t * 0.4) * 0.4) * base * 4 + base * 0.6;
          ox += (tx - ox) * 0.08; oy += (ty - oy) * 0.08;
          const tt = api.reduced ? t * 0.2 : t;
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, SW, SH); gl.useProgram(P1);
          gl.uniform2f(u1.res, SW, SH); gl.uniform1f(u1.t, tt); gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, W, H); gl.useProgram(P);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u.src, 0);
          gl.uniform2f(u.res, W, H); gl.uniform1f(u.t, api.reduced ? t * 0.2 : t);
          gl.uniform2f(u.off, ox, oy);
          const s = sets[si]; gl.uniform3fv(u.i0, s[0]); gl.uniform3fv(u.i1, s[1]); gl.uniform3fv(u.i2, s[2]);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        } catch (e) {}
      },
      resize,
      destroy() { try { gl.deleteBuffer(buf); gl.deleteProgram(P); gl.deleteProgram(P1); gl.deleteTexture(tex); gl.deleteFramebuffer(fbo); const x = gl.getExtension('WEBGL_lose_context'); x && x.loseContext(); } catch (e) {} canvas.remove(); }
    };
  }
});
