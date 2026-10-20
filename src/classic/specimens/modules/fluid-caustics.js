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
    'float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float caus(vec2 uv,float t){',
    '  vec2 p=uv*6.2831-250.;vec2 i=p;float c=1.;float inten=.005;',
    '  for(int n=0;n<5;n++){float tt=t*(1.-(3.5/float(n+1)));',
    '    i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));',
    '    c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));}',
    '  c/=5.;c=1.17-pow(c,1.4);return pow(abs(c),7.);}',
    // ripple height field from ring buffer D (x,y,t0,amp)
    'float rip(vec2 uv,float asp){float h=0.;for(int k=0;k<6;k++){vec4 d=D[k];float age=T-d.z;if(d.w<=0.||age<0.)continue;',
    '  vec2 q=uv-d.xy;q.x*=asp;float r=length(q);float front=age*.32;',
    '  float env=exp(-pow((r-front)*7.,2.))*exp(-age*.55)*d.w;h+=sin((r-front)*48.)*env*.35;}return h;}',
    'vec3 tiles(vec2 p){',
    '  vec2 g=p*7.;vec2 id=floor(g);vec2 f=fract(g);float n=h21(id);',
    '  vec2 e=min(f,1.-f);float m=min(e.x,e.y);',
    '  vec3 col=mix(vec3(.50,.80,.86),vec3(.36,.68,.82),n);',
    '  col*=.86+.14*smoothstep(0.,.16,m);',
    '  col=mix(vec3(.80,.86,.84),col,smoothstep(.015,.045,m));',
    '  float lane=smoothstep(.03,.022,abs(fract(p.x*.36+.13)-.5));',
    '  float cap=step(.5,fract(p.y*.42+.2));',
    '  col=mix(col,vec3(.06,.2,.46),lane*.9);',
    '  return col;}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/R;float asp=R.x/R.y;vec2 w=vec2(uv.x*asp,uv.y);',
    // gentle surface tilt + ripple refraction
    '  float e=1.5/R.y;float h=rip(uv,asp);float hx=rip(uv+vec2(e,0.),asp)-h;float hy=rip(uv+vec2(0.,e),asp)-h;',
    '  vec2 sw=vec2(sin(w.y*5.+T*.9)+sin(w.x*3.1-T*.7),cos(w.x*4.3+T*.8)+cos(w.y*2.7+T*.6))*.004;',
    '  vec2 off=vec2(hx,hy)*.18+sw;',
    '  vec2 fp=w*.9+off*3.;',
    '  vec3 base=tiles(fp);',
    '  float tt=T*.55+23.;vec2 cu=w*.55+off*2.2;',
    '  float cg=caus(cu,tt),cr=caus(cu+vec2(.004,.002),tt);float cb=cg*1.1-cr*.1;',
    '  vec3 cc=vec3(cr,cg,cb);',
    '  float lift=1.+clamp(-(hx+hy)*14.,-.4,1.2);',
    '  vec3 lightCol=vec3(1.,.97,.86);',
    '  vec3 col=base*(.38+.08*sin(T*.3+w.x))+base*cc*3.2*lightCol*lift+cc*.6*lift*lightCol;',
    // depth tint, water absorption toward the far end
    '  float depth=.55+.45*uv.y;',
    '  col=mix(col,col*vec3(.55,.85,1.)+vec3(0.,.04,.09),depth*.55);',
    // surface glints
    '  float gl=pow(max(0.,1.-abs(h)*0.)*clamp((hx-hy)*25.,0.,1.),2.);',
    '  col+=vec3(.9,.97,1.)*gl*.5;',
    // vignette and soft top light
    '  vec2 v=uv-.5;col*=1.-dot(v,v)*.9;col+=vec3(.06,.12,.16)*smoothstep(.4,1.,uv.y);',
    '  col=1.-exp(-col*1.25);col=pow(col,vec3(.92));',
    '  gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  (window.SPECIMENS = window.SPECIMENS || []).push({
    id: 'caustics',
    name: 'Water Caustics',
    family: 'Fluid',
    tags: ['webgl', 'shader', 'light', 'water'],
    blurb: 'Sunlight dances across the tiled floor of a swimming pool, bunching into bright wobbly nets of light. Tap the water and rings spread out, bending the light as they pass.',
    how: 'Caustics are the bright lines you get when a wavy surface focuses light; here a fragment shader (a tiny program run for every pixel) folds coordinates through repeated sine waves to fake that focusing, and ripple rings bend the floor underneath.',
    useFor: 'summer and travel brands, calm hero backgrounds, wellness apps',
    interact: 'Move to stir the surface, click to drop a ripple',
    init: function (host, api) {
      var S = glSpec(host, FS, 0.5, '#0b3a4e');
      var D = new Float32Array(24), slot = 0, lastDrop = -9, nextAuto = 0.2, lastP = null;
      function drop(x, y, t, a) { var i = slot * 4; D[i] = x; D[i + 1] = y; D[i + 2] = t; D[i + 3] = a; slot = (slot + 1) % 6; }
      var T = 0, clickQ = [];
      api.onClick(function (p) { clickQ.push([p.nx, 1 - p.ny]); });
      return {
        frame: function (t, dt) {
          T = api.reduced ? t * 0.35 : t;
          while (clickQ.length) { var c = clickQ.shift(); drop(c[0], c[1], T, 1.0); }
          var p = api.pointer;
          if (p && p.inside) {
            if (lastP && T - lastDrop > 0.9 && Math.hypot(p.nx - lastP[0], p.ny - lastP[1]) > 0.02) { drop(p.nx, 1 - p.ny, T, 0.35); lastDrop = T; }
            lastP = [p.nx, p.ny];
          }
          if (T > nextAuto) { drop(0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7, T, 0.7); nextAuto = T + 2.2 + Math.random() * 1.8; }
          S.draw(T, [0, 0, 0, 0], null, null, D);
        },
        resize: function (w, h) { S.resize(w, h); },
        destroy: function () { S.destroy(); }
      };
    }
  });
})();
