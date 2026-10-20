(window.SPECIMENS = window.SPECIMENS || []).push({
  id: 'marbling',
  name: 'Ink Marbling (Suminagashi)',
  family: 'Organic',
  tags: ['webgl', 'shader', 'marbling', 'ink'],
  blurb: 'Rings of sumi ink and indigo float on still water, then get combed and swirled into feathered ribbons. It is the old Japanese art of floating ink, slowly breathing on screen.',
  how: 'Every pixel runs the marbling math backwards: a drop of ink pushes older rings outward while keeping their area the same, and combing (sliding the surface along wavy tine lines) bends them into feathers. A noise based flow keeps the water moving.',
  useFor: 'book covers, luxury packaging, calm hero art, tea and stationery brands',
  interact: 'Drag across the water to pull the ink, click to drop fresh ink',
  init(host, api) {
    const SCALE = 0.7;
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(cv);
    let gl = null;
    try { gl = cv.getContext('webgl', { antialias: false, preserveDrawingBuffer: true }); } catch (e) { }
    if (!gl) {
      host.style.background = '#efe6d4';
      return { frame() { }, resize() { }, destroy() { cv.remove(); } };
    }
    const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const FS = `
precision highp float;
uniform vec2 R; uniform float T; uniform vec2 M; uniform vec2 MV; uniform float AS;
uniform vec4 D[6]; // xy center, z ring radius, w drop radius
uniform float DC[6];
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
vec3 inkCol(float c, float ring){
 vec3 sumi=vec3(.07,.075,.09), indigo=vec3(.11,.2,.40), rust=vec3(.62,.2,.12), sky=vec3(.3,.45,.6);
 vec3 a = c<.5? sumi : c<1.5? indigo : c<2.5? rust : sky;
 return a;
}
void main(){
 vec2 uv=gl_FragCoord.xy/R; vec2 p=(gl_FragCoord.xy-.5*R)/R.y;
 vec2 q=p;
 // pointer drag: pull the surface backwards along pointer velocity
 vec2 dm=q-M; float g=exp(-dot(dm,dm)*14.);
 q-=MV*g*.9;
 float sw=exp(-dot(dm,dm)*30.);
 float ang=sw*AS; mat2 rot=mat2(cos(ang),-sin(ang),sin(ang),cos(ang)); q=M+rot*(q-M);
 // combing: tines sweep across horizontally and vertically
 float tt=T*.12;
 q.x+= .06*sin(q.y*7.+tt*2.3)*(.6+.4*sin(tt*.7));
 q.y+= .045*sin(q.x*5.-tt*1.7+1.3)*(.6+.4*cos(tt*.5));
 q.x+= .018*sin(q.y*19.+tt*3.1);
 // slow water flow
 vec2 fl=vec2(fbm(q*2.2+vec2(tt*.6,0.)),fbm(q*2.2+vec2(5.2,-tt*.5)))-.5;
 q+=fl*.09;
 // inverse drop transforms, newest first
 vec3 col=vec3(0.); float a=0.;
 for(int i=0;i<6;i++){
   vec2 c=D[i].xy; float r=D[i].z; float Rd=D[i].w;
   vec2 v=q-c; float d2=dot(v,v);
   float inside = step(d2, Rd*Rd);
   if(inside>.5){
     float k=sqrt(d2)/r;
     float ring=floor(k); float f=fract(k);
     float isInk=mod(ring,2.);
     float soft=smoothstep(0.,.06,f)*smoothstep(1.,.94,f);
     float edge=smoothstep(.5,.0,abs(f-.08))*.35+smoothstep(.5,0.,abs(f-.92))*.35;
     float dens=(.6+.35*fbm(q*30.+ring))*(1.-ring/(Rd/r)*.5);
     float al=isInk*soft*clamp(dens+edge,0.,1.);
     col=inkCol(DC[i], ring); a=al;
     // tint alternate rings
     if(mod(ring,4.)>1.5) col=mix(col,inkCol(mod(DC[i]+1.,3.),ring),.7);
     break;
   } else {
     q=c+v*sqrt(max(0.,1.-Rd*Rd/d2));
   }
 }
 // paper
 float pn=fbm(uv*vec2(R.x/R.y,1.)*60.);
 float fib=fbm(vec2(uv.x*400.,uv.y*8.)+pn);
 vec3 paper=vec3(.94,.905,.84)*(.93+.07*pn)-.025*fib;
 vec3 o=mix(paper,col*(.85+.25*pn),a*.92);
 // ink bleed into paper fibers
 o-=a*.03*fib;
 float vig=smoothstep(1.25,.35,length((uv-.5)*vec2(1.2,1.)));
 o*=mix(.82,1.,vig);
 gl_FragColor=vec4(o,1.);
}`;
    function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['R', 'T', 'M', 'MV', 'AS', 'D', 'DC'].forEach(n => U[n] = gl.getUniformLocation(pr, n === 'D' || n === 'DC' ? n + '[0]' : n));

    let W = 0, H = 0;
    const drops = [];
    function newDrop(x, y, now) {
      // x,y in shader space (centered, y up, units of height)
      drops.unshift({ x, y, r: 0.026 + Math.random() * 0.014, R: 0, Rmax: 0.25 + Math.random() * 0.22, c: (Math.random() * 3.99) | 0, born: now });
      if (drops.length > 6) drops.pop();
    }
    // initial composition
    const aspect = () => (W / H) || 1.5;
    function seed() {
      drops.length = 0;
      const pts = [[-0.45, 0.2], [0.35, -0.15], [0.05, 0.28], [-0.15, -0.3], [0.6, 0.25], [0, 0]];
      pts.forEach((p, i) => { newDrop(p[0] * Math.min(aspect(), 1.8) / 1.6, p[1], -10); drops[0].R = drops[0].Rmax; drops[0].c = i % 3; });
    }
    let started = false;
    function resize() {
      W = host.clientWidth || 400; H = host.clientHeight || 300;
      cv.width = Math.max(1, Math.round(W * SCALE * Math.min(window.devicePixelRatio || 1, 1.25)));
      cv.height = Math.max(1, Math.round(H * SCALE * Math.min(window.devicePixelRatio || 1, 1.25)));
      gl.viewport(0, 0, cv.width, cv.height);
      if (!started) { seed(); started = true; }
    }
    resize();
    let mx = 0, my = 0, vx = 0, vy = 0, lastx = null, lasty = null, spin = 0, nextDrop = 6, clock = 0;
    api.onClick((p) => { try { newDrop((p.x - W / 2) / H, (H / 2 - p.y) / H, clock); } catch (e) { } });
    const Darr = new Float32Array(24), Carr = new Float32Array(6);
    return {
      frame(t, dt) {
        try {
          dt = Math.min(dt || 0.016, 0.05);
          const sp = api.reduced ? 0.25 : 1;
          clock += dt * sp;
          const p = api.pointer;
          const px = p ? (p.x - W / 2) / H : 0, py = p ? (H / 2 - p.y) / H : 0;
          if (lastx === null) { lastx = px; lasty = py; }
          const ivx = (px - lastx), ivy = (py - lasty);
          lastx = px; lasty = py;
          const k = p && p.inside ? 1 : 0;
          vx = vx * 0.92 + ivx * 2.2 * k; vy = vy * 0.92 + ivy * 2.2 * k;
          spin = spin * 0.95 + (ivx * (py - my) - ivy * (px - mx)) * 0 + Math.hypot(ivx, ivy) * 6 * k;
          mx += (px - mx) * 0.3; my += (py - my) * 0.3;
          if (clock > nextDrop) { nextDrop = clock + 7 + Math.random() * 4; newDrop((Math.random() - 0.5) * aspect() * 0.8, (Math.random() - 0.5) * 0.7, clock); }
          for (const d of drops) d.R += (d.Rmax - d.R) * (1 - Math.pow(0.35, dt * sp));
          for (let i = 0; i < 6; i++) {
            const d = drops[i];
            if (d) { Darr.set([d.x, d.y, d.r, d.R], i * 4); Carr[i] = d.c; }
            else { Darr.set([99, 99, 0.03, 0], i * 4); Carr[i] = 0; }
          }
          gl.uniform2f(U.R, cv.width, cv.height);
          gl.uniform1f(U.T, clock * 1.0 + 20);
          gl.uniform2f(U.M, mx, my);
          gl.uniform2f(U.MV, Math.max(-0.4, Math.min(0.4, vx)), Math.max(-0.4, Math.min(0.4, vy)));
          gl.uniform1f(U.AS, Math.min(spin, 3));
          gl.uniform4fv(U.D, Darr); gl.uniform1fv(U.DC, Carr);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        } catch (e) { }
      },
      resize() { try { resize(); } catch (e) { } },
      destroy() {
        try { gl.deleteProgram(pr); gl.deleteBuffer(buf); const x = gl.getExtension('WEBGL_lose_context'); x && x.loseContext(); } catch (e) { }
        cv.remove();
      }
    };
  }
});
