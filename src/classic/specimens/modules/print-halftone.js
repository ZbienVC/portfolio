(window.SPECIMENS = window.SPECIMENS || []).push({
  id: 'print-halftone',
  name: 'CMYK Halftone Dots',
  family: 'Print',
  tags: ['webgl', 'halftone', 'cmyk', 'print'],
  blurb: 'A glowing sunset scene printed the way old magazines and comic books were: thousands of tiny cyan, magenta, yellow and black dots that blend into color from a distance. Hover to look through a loupe and see the dots up close.',
  how: 'The image is split into four ink layers, and each layer becomes a grid of dots turned to its own screen angle, where a screen angle is the tilt of the dot grid that keeps the inks from clashing. Bigger dots mean more ink, and the layers multiply over paper like real overprinting.',
  useFor: 'editorial heroes, comic and pop-art themes, retro product pages',
  interact: 'Move to slide the loupe, click to change the screen size',
  init(host, api) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#f3eee3';
    host.appendChild(canvas);
    let gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }); } catch (e) {}
    if (!gl) { return { frame() {}, resize() {}, destroy() { canvas.remove(); } }; }

    const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const COMMON = `precision highp float;
uniform vec2 uRes;uniform float uT;uniform vec2 uM;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+7.1;a*=.5;}return v;}
`;
    // Pass 1: procedural source image (low res)
    const FS1 = COMMON + `
vec3 sphere(vec2 p, vec2 c, float r, vec3 base, inout vec3 col, inout float hit){
  vec2 d=(p-c)/r; float l=dot(d,d);
  if(l<1.){vec3 n=vec3(d,sqrt(1.-l));vec3 L=normalize(vec3(-.55,.6,.65));
    float dif=max(dot(n,L),0.);float sp=pow(max(dot(reflect(-L,n),vec3(0,0,1)),0.),24.);
    float rim=pow(1.-n.z,3.);
    col=base*(.12+.95*dif)+vec3(1.,.95,.85)*sp*.9+vec3(.2,.5,1.)*rim*.5;hit=1.;}
  return col;
}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float T=uT;
  vec3 col=mix(vec3(1.,.78,.35),vec3(.95,.25,.42),smoothstep(-.2,.25,p.y));
  col=mix(col,vec3(.25,.35,.75),smoothstep(.15,.6,p.y));
  // sun glow
  vec2 sc=vec2(-.35+.08*sin(T*.3),.05);
  col+=vec3(1.,.8,.4)*.6*exp(-6.*length(p-sc));
  // clouds
  float cl=fbm(vec2(p.x*2.5+T*.05,p.y*6.));
  col=mix(col,vec3(1.,.9,.85),smoothstep(.55,.8,cl)*smoothstep(.0,.35,p.y)*.7);
  float hit=0.;
  // planets
  vec2 c1=vec2(.18*sin(T*.45)+.12,.06+.06*sin(T*.7));
  col=sphere(p,c1,.24,vec3(.15,.75,.95),col,hit);
  vec2 c2=c1+vec2(cos(T*.9),sin(T*.9)*.35)*.36;
  if(sin(T*.9)<0.||hit<.5){col=sphere(p,c2,.07,vec3(1.,.85,.1),col,hit);}
  // hills
  for(int i=0;i<3;i++){float fi=float(i);
    float h=-.18-fi*.11+.09*fbm(vec2(p.x*(1.6+fi)+T*.04*(fi+1.)+fi*3.,fi));
    if(p.y<h){vec3 hc=mix(vec3(.95,.35,.5),vec3(.1,.2,.45),fi/2.);
      hc*=.75+.35*fbm(p*8.+fi);col=hc;}
  }
  gl_FragColor=vec4(col,1.);
}`;
    // Pass 2: halftone
    const FS2 = COMMON + `
uniform sampler2D uSrc;uniform float uCell;uniform float uLens;
vec3 src(vec2 fc){return texture2D(uSrc,clamp(fc/uRes,0.,1.)).rgb;}
vec4 cmyk(vec3 c){float k=1.-max(c.r,max(c.g,c.b));float kk=pow(k,1.6)*.85;
  vec3 cmy=(1.-c-k)/max(1.-k,.001);return vec4(cmy*(1.-k*.15),kk);}
float inkLayer(vec2 fc,float ang,int ch,float s){
  float ca=cos(ang),sa=sin(ang);mat2 R=mat2(ca,-sa,sa,ca);mat2 Ri=mat2(ca,sa,-sa,ca);
  vec2 q=R*fc/s;float best=0.;
  {
    vec2 cc=floor(q)+.5;vec2 cs=Ri*(cc*s);
    vec4 v=cmyk(src(cs));float cov=ch==0?v.x:ch==1?v.y:ch==2?v.z:v.w;
    float r=sqrt(clamp(cov*.92,0.,1.))*.7;
    float d=length(q-cc);
    float rough=(hash(floor(fc*.5)+float(ch))-.5)*.05;
    float aa=1.2/s;
    best=max(best,1.-smoothstep(r-aa+rough,r+aa+rough,d));
  }
  return best;
}
void main(){
  vec2 fc=gl_FragCoord.xy;vec2 m=uM*uRes;
  float R=uLens*uRes.y;float dl=length(fc-m);
  float s=uCell;vec2 sp=fc;float inL=1.-smoothstep(R-1.5,R+1.5,dl);
  if(dl<R+2.){float k=dl/R;vec2 dir=fc-m;sp=m+dir/(2.8)*(1.+.25*k*k);}
  vec3 paper=vec3(.965,.94,.885);
  float fib=noise(fc*vec2(.08,.02))*.05+hash(fc)*.03;
  paper-=fib;
  vec3 col=paper;
  float c=inkLayer(sp,radians(15.),0,s);
  float mg=inkLayer(sp,radians(75.),1,s);
  float y=inkLayer(sp,radians(0.),2,s);
  float k=inkLayer(sp,radians(45.),3,s);
  float den=.9+.15*noise(fc*.05);
  col*=mix(vec3(1.),vec3(0.,.63,.9),c*.95*den);
  col*=mix(vec3(1.),vec3(.93,.05,.52),mg*.92*den);
  col*=mix(vec3(1.),vec3(1.,.9,.0),y*.95);
  col*=mix(vec3(1.),vec3(.12,.11,.13),k*.96*den);
  // lens
  vec3 outC=col;
  if(dl<R+40.){
    float sh=smoothstep(R+30.,R,dl)*(1.-inL);
    vec3 outside=vec3(0.);
    // shadow outside lens
    outC=mix(col,col*.55,sh*.6*(1.-inL));
    float ring=smoothstep(R-6.,R-1.,dl)*inL;
    outC=mix(outC,vec3(.08,.08,.1),ring);
    float glint=pow(max(0.,1.-length((fc-m)/R-vec2(-.45,.45))*2.2),3.);
    outC+=glint*.35*inL;
    outC*=mix(1.,.92+.08*(1.-dl/R),inL);
  }
  // vignette
  vec2 uv=fc/uRes;outC*=.9+.1*smoothstep(.0,.35,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
  gl_FragColor=vec4(outC,1.);
}`;
    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    function prog(fs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
    let P1, P2;
    try { P1 = prog(FS1); P2 = prog(FS2); } catch (e) { console.warn('halftone shader', e); return { frame() {}, resize() {}, destroy() { canvas.remove(); } }; }
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture(); const fbo = gl.createFramebuffer();
    let W = 1, H = 1, SW = 1, SH = 1;
    const U = (p, n) => gl.getUniformLocation(p, n);
    const u1 = { res: U(P1, 'uRes'), t: U(P1, 'uT') };
    const u2 = { res: U(P2, 'uRes'), t: U(P2, 'uT'), m: U(P2, 'uM'), src: U(P2, 'uSrc'), cell: U(P2, 'uCell'), lens: U(P2, 'uLens') };
    const cells = [1, 1.6, 0.7]; let ci = 0;
    let mx = 0.6, my = 0.4;
    function resize(w, h) {
      W = Math.max(2, Math.round(w * dpr)); H = Math.max(2, Math.round(h * dpr));
      canvas.width = W; canvas.height = H;
      SW = Math.max(2, Math.round(W / 3)); SH = Math.max(2, Math.round(H / 3));
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SW, SH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    resize(host.clientWidth, host.clientHeight);
    api.onClick(() => { ci = (ci + 1) % cells.length; });
    return {
      frame(t) {
        try {
          const pt = api.pointer;
          const tx = pt.inside ? pt.nx : 0.5 + 0.25 * Math.sin(t * 0.4);
          const ty = pt.inside ? 1 - pt.ny : 0.5 + 0.15 * Math.cos(t * 0.5);
          mx += (tx - mx) * 0.15; my += (ty - my) * 0.15;
          const tt = api.reduced ? t * 0.2 : t;
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, SW, SH);
          gl.useProgram(P1); gl.uniform2f(u1.res, SW, SH); gl.uniform1f(u1.t, tt);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
          gl.useProgram(P2); gl.uniform2f(u2.res, W, H); gl.uniform1f(u2.t, tt);
          gl.uniform2f(u2.m, mx, my);
          gl.uniform1f(u2.cell, Math.max(5 * dpr, H / 66) * cells[ci]);
          gl.uniform1f(u2.lens, 0.2);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u2.src, 0);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        } catch (e) {}
      },
      resize,
      destroy() {
        try { gl.deleteTexture(tex); gl.deleteFramebuffer(fbo); gl.deleteBuffer(buf); gl.deleteProgram(P1); gl.deleteProgram(P2); const x = gl.getExtension('WEBGL_lose_context'); x && x.loseContext(); } catch (e) {}
        canvas.remove();
      }
    };
  }
});
