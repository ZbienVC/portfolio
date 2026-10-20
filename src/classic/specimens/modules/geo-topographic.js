(function () {
  (window.SPECIMENS = window.SPECIMENS || []).push({
    id: 'topographic-lines',
    name: 'Topographic Lines',
    family: 'Geometry',
    tags: ['webgl', 'shader', 'contours', 'cartography'],
    blurb: 'A slowly breathing landscape drawn the way a survey map would draw it: fine contour lines, bolder index lines every fifth step, and soft shaded valleys and peaks.',
    how: 'A smooth random height field (noise) is sliced at even heights, and each slice becomes a line, the same way real maps draw contour lines, called isolines, where every point on a line sits at the same height.',
    useFor: 'outdoor brands, data and climate stories, about pages, print-style backgrounds',
    interact: 'Move to raise a hill under the pointer, click to shift the terrain',
    init(host, api) {
      const cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#efe7d6';
      host.appendChild(cv);
      const lab = document.createElement('div');
      lab.style.cssText = 'position:absolute;left:14px;bottom:12px;font:500 10px/1.4 "JetBrains Mono",monospace;letter-spacing:.12em;color:rgba(60,48,36,.7);pointer-events:none;text-transform:uppercase';
      host.appendChild(lab);
      let gl, prog, buf, uni = {}, W = 1, H = 1, scale = 0.7, seed = 0, seedT = 0, mx = 0.5, my = 0.5, hill = 0;
      try { api.onClick(() => { seed += 1; }); } catch (e) {}
      const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      const FS = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 res;uniform float time;uniform vec2 mouse;uniform float hill;uniform float seed;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
float height(vec2 p){
 vec2 q=vec2(fbm(p+vec2(seed*3.1,time*.03)),fbm(p+vec2(5.2,1.3-time*.025)));
 float h=fbm(p*0.8+q*0.9+seed);
 vec2 d=p-mouse;h+=hill*.22*exp(-dot(d,d)*2.2);
 return h;}
void main(){
 vec2 uv=gl_FragCoord.xy/res;float asp=res.x/res.y;
 vec2 p=vec2(uv.x*asp,uv.y)*1.7;
 float h=height(p);
 float N=30.;float v=h*N;
 float w=fwidth(v);
 float f=abs(fract(v-.5)-.5)/max(w,1e-4);
 float line=(1.-clamp(f-.05,0.,1.))*clamp(1.5-w*2.,0.,1.);
 float idx=abs(fract(v/5.-.5)-.5)*5./max(w,1e-4);
 float iline=(1.-clamp(idx-.55,0.,1.))*clamp(1.5-w*1.5,0.,1.);
 // hillshade from gradient
 float e=.004;float hx=height(p+vec2(e,0.))-h;float hy=height(p+vec2(0.,e))-h;
 vec3 n=normalize(vec3(-hx/e*.18,-hy/e*.18,1.));
 float sh=clamp(dot(n,normalize(vec3(-.6,.7,.8))),0.,1.);
 // hypsometric tint
 float t=clamp((h-.25)/.6,0.,1.);
 float band=floor(t*9.)/9.;
 vec3 lo=vec3(.80,.86,.80),mid=vec3(.93,.89,.78),hi=vec3(.86,.74,.62),top=vec3(.97,.95,.92);
 vec3 col=mix(lo,mid,smoothstep(0.,.45,band));col=mix(col,hi,smoothstep(.45,.8,band));col=mix(col,top,smoothstep(.85,1.,band));
 if(h<.31){float wd=smoothstep(.31,.26,h);col=mix(col,vec3(.62,.76,.82),wd*.85);}
 col*=.78+.32*sh;
 vec3 ink=vec3(.42,.27,.17);
 if(h<.31) ink=vec3(.2,.38,.52);
 col=mix(col,ink,line*.5);
 col=mix(col,ink*.75,iline*.85);
 // paper grain + grid
 float gr=hash(gl_FragCoord.xy+fract(time))*.04;col-=gr;
 vec2 g=abs(fract(p*1.25)-.5)/fwidth(p*1.25);float grid=1.-clamp(min(g.x,g.y)-.3,0.,1.);
 col=mix(col,vec3(.55,.45,.38),grid*.18);
 vec2 vv=uv*(1.-uv);col*=.82+.18*pow(vv.x*vv.y*16.,.25);
 gl_FragColor=vec4(col,1.);
}`;
      function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
      try {
        gl = cv.getContext('webgl', { antialias: false, alpha: false });
        gl.getExtension('OES_standard_derivatives');
        prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog); gl.useProgram(prog);
        buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ['res', 'time', 'mouse', 'hill', 'seed'].forEach(n => uni[n] = gl.getUniformLocation(prog, n));
      } catch (e) { gl = null; }
      function resize(w, h) {
        W = Math.max(1, w); H = Math.max(1, h);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        scale = W * H > 500000 ? 0.6 : 0.85;
        cv.width = Math.round(W * dpr * scale); cv.height = Math.round(H * dpr * scale);
      }
      resize(host.clientWidth, host.clientHeight);
      return {
        frame(t, dt) {
          try {
            dt = Math.min(dt || 0.016, 0.1);
            const p = api.pointer || {};
            const asp = W / H;
            if (p.inside) { mx += (p.nx - mx) * Math.min(1, dt * 4); my += ((1 - p.ny) - my) * Math.min(1, dt * 4); }
            hill += ((p.inside ? 1 : 0) - hill) * Math.min(1, dt * 2);
            seedT += (seed - seedT) * Math.min(1, dt * 1.5);
            const tt = api.reduced ? t * 0.2 : t;
            const elev = Math.round(1200 + Math.sin(t * 0.3) * 80 + hill * 220);
            lab.textContent = 'Sheet 14-B   Contour interval 20 m   Elev ' + elev + ' m   ' + (mx * 47.3 + 12).toFixed(3) + ' N';
            if (!gl) return;
            gl.viewport(0, 0, cv.width, cv.height);
            gl.uniform2f(uni.res, cv.width, cv.height);
            gl.uniform1f(uni.time, tt);
            gl.uniform2f(uni.mouse, mx * asp * 1.7, my * 1.7);
            gl.uniform1f(uni.hill, hill);
            gl.uniform1f(uni.seed, seedT * 1.7);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          } catch (e) { }
        },
        resize,
        destroy() {
          try { if (gl) { gl.deleteBuffer(buf); gl.deleteProgram(prog); const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } } catch (e) {}
          cv.remove(); lab.remove();
        }
      };
    }
  });
})();
