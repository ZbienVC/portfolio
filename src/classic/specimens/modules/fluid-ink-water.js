(function () {
  // Self-contained WebGL helper: one full-screen triangle and a fragment shader, drawn at reduced scale.
  function glSpec(host, FS, scale, bg) {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;background:' + (bg || '#06070c') + ';';
    host.appendChild(c);
    var gl = null, prog = null, buf = null, U = {}, ok = false, W = 1, H = 1;
    try {
      gl = c.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL unavailable');
      var sh = function (t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, 'precision highp float;\nuniform vec2 R;uniform float T;uniform vec4 M;uniform vec4 K;uniform vec4 Q;uniform vec4 D[6];\n' + FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['R', 'T', 'M', 'K', 'Q'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
      U.D = gl.getUniformLocation(prog, 'D[0]') || gl.getUniformLocation(prog, 'D');
      ok = true;
    } catch (e) { try { console.log('fluid specimen fallback: ' + (e && e.message)); } catch (_) {} }
    function resize(w, h) {
      W = Math.max(1, Math.round((w || 300) * dpr * scale)); H = Math.max(1, Math.round((h || 200) * dpr * scale));
      c.width = W; c.height = H; if (ok) gl.viewport(0, 0, W, H);
    }
    resize(host.clientWidth, host.clientHeight);
    return {
      ok: function () { return ok; },
      size: function () { return [W, H]; },
      draw: function (t, m, k, q, d) {
        if (!ok) return;
        try {
          gl.uniform2f(U.R, W, H); gl.uniform1f(U.T, t);
          gl.uniform4fv(U.M, m || [0, 0, 0, 0]); gl.uniform4fv(U.K, k || [0, 0, 0, 0]); gl.uniform4fv(U.Q, q || [0, 0, 0, 0]);
          if (U.D && d) gl.uniform4fv(U.D, d);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        } catch (e) {}
      },
      resize: resize,
      destroy: function () {
        try { if (gl) { gl.deleteBuffer(buf); gl.deleteProgram(prog); var x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } } catch (e) {}
        try { c.remove(); } catch (e) {}
      }
    };
  }


  var FS = [
    'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    '  float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453),b=fract(sin(dot(i+vec2(1.,0.),vec2(127.1,311.7)))*43758.5453);',
    '  float c=fract(sin(dot(i+vec2(0.,1.),vec2(127.1,311.7)))*43758.5453),d=fract(sin(dot(i+vec2(1.,1.),vec2(127.1,311.7)))*43758.5453);',
    '  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n2(p);p=m*p;a*=.5;}return v;}',
    // curl of a noise field: a swirling flow that never piles up
    'vec2 curl(vec2 p){float e=.08;float a=fbm(p+vec2(0.,e)),b=fbm(p-vec2(0.,e)),c=fbm(p+vec2(e,0.)),d=fbm(p-vec2(e,0.));return vec2(a-b,-(c-d))/(2.*e);}',
    // one ink drop: a falling head with a trailing stem, spreading over its life
    'float drop(vec2 p,vec4 d,float asp){float age=T-d.z;if(age<0.||d.w<=0.)return 0.;',
    '  float fall=.55*(1.-exp(-age*.35));vec2 h=vec2(d.x*asp,d.y-fall);',
    '  float r=.05+.06*sqrt(age);',
    '  vec2 q=p-h;q.y*=1.25;float head=exp(-dot(q,q)/(r*r));',
    // mushroom ring: two lobes curling back
    '  vec2 q2=vec2(abs(p.x-h.x)-r*.9,p.y-h.y-r*.2);float ring=exp(-dot(q2,q2)/(r*r*.35))*.8;',
    '  float sy=clamp((p.y-h.y)/max(fall,1e-3),0.,1.);float stemw=r*(.25+.5*sy);',
    '  float stem=exp(-pow((p.x-h.x-.04*sin(p.y*9.+age))/stemw,2.))*step(h.y,p.y)*step(p.y,d.y+.02)*.55;',
    '  return (head+ring+stem)*exp(-age*.06)*min(1.,age*2.);}',
    'float field(vec2 p,float asp){float s=0.;for(int k=0;k<6;k++)s+=drop(p,D[k],asp);return s;}',
    'float layer(vec2 p,float asp,float seed,float sc){',
    '  vec2 q=p;float t=T*.05+seed;',
    '  for(int i=0;i<3;i++){q+=curl(q*sc+vec2(seed,t))*.045;}',
    '  float f=field(q,asp);',
    '  float detail=fbm(q*sc*2.4+vec2(-t*2.,seed));',
    '  float dd=f*pow(detail,1.6)*2.4;',
    '  return smoothstep(.06,1.6,dd);}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/R;float asp=R.x/R.y;vec2 p=vec2(uv.x*asp,uv.y);',
    // clear bright water: soft top light, faint caustic shimmer
    '  vec3 water=mix(vec3(.80,.86,.88),vec3(.97,.97,.94),uv.y);',
    '  float sh=fbm(p*5.+vec2(T*.15,-T*.1));water+=vec3(.03,.035,.03)*sh;',
    '  vec3 col=water;',
    // three ink layers, far to near: further layers paler and bluer
    '  float l3=layer(p+vec2(.03,0.),asp,11.,3.2);col=mix(col,vec3(.45,.55,.68),l3*.45);',
    '  float l2=layer(p,asp,4.,4.2);col=mix(col,mix(vec3(.14,.17,.36),vec3(.62,.12,.22),K.x),l2*.75);',
    '  float l1=layer(p-vec2(.01,0.),asp,0.,5.5);vec3 ink=vec3(.03,.04,.12);',
    // darker core, slightly colored fringes where ink thins out
    '  vec3 fr=mix(vec3(.2,.28,.6),vec3(.75,.18,.25),K.x);',
    '  col=mix(col,fr,smoothstep(0.,.35,l1)*.5);col=mix(col,ink,smoothstep(.3,1.,l1)*.85);',
    // backlight halo glowing through thin ink
    '  col+=vec3(.06,.05,.02)*(1.-l1)*smoothstep(.6,1.,uv.y);',
    '  vec2 v=uv-.5;col*=1.-dot(v,v)*.55;',
    '  float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+T)*43758.5453);col+=(g-.5)*.025;',
    '  gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  (window.SPECIMENS = window.SPECIMENS || []).push({
    id: 'ink-water',
    name: 'Ink in Water',
    family: 'Fluid',
    tags: ['webgl', 'curl-noise', 'smoke', 'organic'],
    blurb: 'Drops of deep blue ink fall into a clear tank and bloom into curling, smoky clouds that slowly spread and fade. A few drops carry a hint of crimson, like a calligrapher rinsing a brush.',
    how: 'Each drop is a soft falling blob whose position is pushed around by curl noise (a swirl pattern that moves things without bunching them up), and three layers at different depths are stacked for a sense of a real tank.',
    useFor: 'editorial and art sites, perfume and tea brands, calm intros',
    interact: 'Click to drop ink where you point',
    init: function (host, api) {
      var S = glSpec(host, FS, 0.5, '#d9dfe0');
      var D = new Float32Array(24), slot = 0, T = 0, clickQ = [], nextAuto = 3.5, hueT = 0;
      function drop(x, y, t0) { var i = slot * 4; D[i] = x; D[i + 1] = y; D[i + 2] = t0; D[i + 3] = 1; slot = (slot + 1) % 6; }
      // pre-seed so the tank is already full of ink at first glance
      drop(0.3, 0.98, -9); drop(0.62, 0.95, -6); drop(0.78, 1.0, -3); drop(0.45, 0.9, -1.2);
      api.onClick(function (p) { clickQ.push([p.nx, 1 - p.ny]); });
      return {
        frame: function (t, dt) {
          T = api.reduced ? t * 0.35 : t;
          while (clickQ.length) { var c = clickQ.shift(); drop(c[0], Math.min(1.02, c[1] + 0.05), T); }
          if (T > nextAuto) { drop(0.15 + Math.random() * 0.7, 0.92 + Math.random() * 0.1, T); nextAuto = T + 3 + Math.random() * 2.5; }
          hueT = 0.22 + 0.22 * Math.sin(T * 0.12);
          S.draw(T, [0, 0, 0, 0], [hueT, 0, 0, 0], null, D);
        },
        resize: function (w, h) { S.resize(w, h); },
        destroy: function () { S.destroy(); }
      };
    }
  });
})();
