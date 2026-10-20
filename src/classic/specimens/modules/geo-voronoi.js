(function () {
  (window.SPECIMENS = window.SPECIMENS || []).push({
    id: 'voronoi-stained-glass',
    name: 'Voronoi Stained Glass',
    family: 'Geometry',
    tags: ['webgl', 'shader', 'voronoi', 'cellular'],
    blurb: 'A cathedral window made of drifting glass shards, each one glowing like sunlight is pouring through it, held together by dark lead lines that slowly shift and reshape.',
    how: 'Each shard is a Voronoi cell, meaning the area of the screen that is closer to one moving seed point than to any other, and the shader measures the distance to the nearest border to draw the lead and the inner glow.',
    useFor: 'hero backgrounds, music and arts sites, premium loading screens, poster art',
    interact: 'Move to shine a light through the glass, click to shatter into a new pattern',
    init(host, api) {
      const cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#0a0710';
      host.appendChild(cv);
      let gl, prog, buf, uni = {}, W = 1, H = 1, mx = 0.5, my = 0.5, seed = 0, burst = 0;
      try { api.onClick(() => { seed += 1; burst = 1; }); } catch (e) {}
      const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      const FS = `precision highp float;
uniform vec2 res;uniform float time;uniform vec2 mouse;uniform float seed;uniform float burst;
vec2 h2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p+seed*7.31)*43758.5453);}
float h1(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1))+seed*3.7)*15731.743);}
vec3 pal(float t){
 vec3 a[6];
 if(t<.18) return vec3(.62,.05,.12);
 if(t<.34) return vec3(.05,.22,.62);
 if(t<.48) return vec3(.95,.62,.08);
 if(t<.6) return vec3(.06,.45,.32);
 if(t<.72) return vec3(.42,.08,.5);
 if(t<.84) return vec3(.04,.5,.66);
 return vec3(.9,.32,.06);}
void main(){
 vec2 uv=gl_FragCoord.xy/res;float asp=res.x/res.y;
 float sc=res.y<400.?4.2:5.2;
 vec2 p=vec2(uv.x*asp,uv.y)*sc;
 vec2 ip=floor(p),fp=fract(p);
 float d1=8.,d2=8.;vec2 id=vec2(0.),mr=vec2(0.);
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
  vec2 g=vec2(float(i),float(j));vec2 o=h2(ip+g);
  o=.5+.42*sin(time*.35+6.2831*o);
  vec2 r=g+o-fp;float d=dot(r,r);
  if(d<d1){d2=d1;d1=d;id=ip+g;mr=r;}else if(d<d2){d2=d;}
 }
 // exact border distance pass
 float bd=8.;
 for(int j=-2;j<=2;j++)for(int i=-2;i<=2;i++){
  vec2 g=vec2(float(i),float(j));vec2 o=h2(ip+g);o=.5+.42*sin(time*.35+6.2831*o);
  vec2 r=g+o-fp;
  if(dot(mr-r,mr-r)>1e-5) bd=min(bd,dot(.5*(mr+r),normalize(r-mr)));
 }
 float hv=h1(id);
 vec3 glass=pal(hv);
 glass*=.75+.5*h1(id+3.1);
 // light source
 vec2 L=vec2(mouse.x*asp,mouse.y)*sc;
 float ld=length(p-L)/sc;
 float light=.35+1.3*exp(-ld*ld*5.)+.25*exp(-ld*1.5);
 // per-cell inner glow, brighter toward the centre of the shard
 float c=sqrt(d1);
 float inner=1.-smoothstep(0.,.7,c);
 // glass texture: streaks and bubbles
 float streak=.9+.06*sin((p.x*cos(hv*6.)+p.y*sin(hv*6.))*23.+hv*40.)+.06*sin(p.x*7.+p.y*5.+hv*20.);
 float bub=smoothstep(.04,.0,length(fract(p*3.1+hv*9.)-.5)-.08)*.15;
 vec3 col=glass*light*(.55+.65*inner)*streak+bub*glass*light;
 col+=pow(max(0.,light-1.),2.)*vec3(1.,.9,.7)*.25*inner;
 // lead lines with bevel highlight
 float lw=.055;
 float lead=smoothstep(lw,lw+.02,bd);
 float bevel=smoothstep(lw+.06,lw,bd)*lead;
 col*=lead;
 col+=bevel*glass*light*.6;
 vec3 leadc=vec3(.05,.045,.05)+vec3(.12,.11,.1)*smoothstep(0.,lw,bd)*(1.-smoothstep(lw*.5,lw,bd))*light*.8;
 col+=(1.-lead)*leadc;
 col+=burst*glass*(1.-lead)*0.;
 col*=1.+burst*.6*inner;
 // god ray haze
 vec2 dirv=normalize(vec2(uv.x-mouse.x,uv.y-mouse.y)+1e-4);
 col+=vec3(1.,.85,.6)*.05*exp(-ld*2.)*(.5+.5*sin(atan(dirv.y,dirv.x)*14.+time*.4));
 // vignette and tone
 vec2 vv=uv*(1.-uv);col*=.45+.55*pow(vv.x*vv.y*16.,.35);
 col=col/(1.+col*.35);
 col=pow(col,vec3(.92));
 gl_FragColor=vec4(col,1.);
}`;
      function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
      try {
        gl = cv.getContext('webgl', { antialias: false, alpha: false });
        prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog); gl.useProgram(prog);
        buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ['res', 'time', 'mouse', 'seed', 'burst'].forEach(n => uni[n] = gl.getUniformLocation(prog, n));
      } catch (e) { gl = null; }
      function resize(w, h) {
        W = Math.max(1, w); H = Math.max(1, h);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        const scale = W * H > 500000 ? 0.6 : 0.85;
        cv.width = Math.round(W * dpr * scale); cv.height = Math.round(H * dpr * scale);
      }
      resize(host.clientWidth, host.clientHeight);
      return {
        frame(t, dt) {
          try {
            if (!gl) return;
            dt = Math.min(dt || 0.016, 0.1);
            const p = api.pointer || {};
            const tx = p.inside ? p.nx : 0.5 + 0.3 * Math.sin(t * 0.3), ty = p.inside ? 1 - p.ny : 0.6 + 0.2 * Math.cos(t * 0.23);
            mx += (tx - mx) * Math.min(1, dt * 3); my += (ty - my) * Math.min(1, dt * 3);
            burst *= Math.exp(-dt * 2.5);
            gl.viewport(0, 0, cv.width, cv.height);
            gl.uniform2f(uni.res, cv.width, cv.height);
            gl.uniform1f(uni.time, api.reduced ? t * 0.2 : t);
            gl.uniform2f(uni.mouse, mx, my);
            gl.uniform1f(uni.seed, seed);
            gl.uniform1f(uni.burst, burst);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          } catch (e) { }
        },
        resize,
        destroy() {
          try { if (gl) { gl.deleteBuffer(buf); gl.deleteProgram(prog); const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } } catch (e) {}
          cv.remove();
        }
      };
    }
  });
})();
