(function () {
  // Small self-contained WebGL helper: one full-screen triangle and a fragment shader.
  function glSpec(host, FS, scale) {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;background:#07060b;';
    host.appendChild(c);
    var gl = null, prog = null, buf = null, U = {}, ok = false, W = 1, H = 1;
    try {
      gl = c.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL unavailable');
      var sh = function (t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, 'precision highp float;\nuniform vec2 R;uniform float T;uniform vec4 M;uniform vec4 K;uniform vec4 Q;\n' + FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['R', 'T', 'M', 'K', 'Q'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
      ok = true;
    } catch (e) { try { console.log('shader specimen fallback: ' + (e && e.message)); } catch (_) {} }
    function resize(w, h) {
      W = Math.max(1, Math.round((w || 300) * dpr * scale)); H = Math.max(1, Math.round((h || 200) * dpr * scale));
      c.width = W; c.height = H; if (ok) gl.viewport(0, 0, W, H);
    }
    resize(host.clientWidth, host.clientHeight);
    return {
      size: function () { return [W, H]; },
      draw: function (t, m, k, q) {
        if (!ok) return;
        try {
          gl.uniform2f(U.R, W, H); gl.uniform1f(U.T, t);
          gl.uniform4fv(U.M, m || [0, 0, 0, 0]); gl.uniform4fv(U.K, k || [0, 0, 0, 0]); gl.uniform4fv(U.Q, q || [0, 0, 0, 0]);
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
    'float trapG;vec3 trapC;',
    'float DE(vec3 p){',
    '  vec3 z=p;float dr=1.;float r=0.;float pw=8.+sin(T*.11)*1.2;',
    '  trapG=1e9;trapC=vec3(1e9);',
    '  for(int i=0;i<6;i++){',
    '    r=length(z);if(r>2.)break;',
    '    float th=acos(clamp(z.z/r,-1.,1.))+T*.05;float ph=atan(z.y,z.x);',
    '    dr=pow(r,pw-1.)*pw*dr+1.;',
    '    float zr=pow(r,pw);th*=pw;ph*=pw;',
    '    z=zr*vec3(sin(th)*cos(ph),sin(ph)*sin(th),cos(th))+p;',
    '    trapC=min(trapC,abs(z));trapG=min(trapG,dot(z,z));',
    '  }',
    '  return .5*log(r)*r/dr;',
    '}',
    'vec3 nrm(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(DE(p+e.xyy)-DE(p-e.xyy),DE(p+e.yxy)-DE(p-e.yxy),DE(p+e.yyx)-DE(p-e.yyx)));}',
    'vec3 pal(float t){return .5+.5*cos(6.2831*(vec3(1.,1.,1.)*t+vec3(.0,.33,.67)));}',
    'void main(){',
    '  vec2 uv=(gl_FragCoord.xy*2.-R)/min(R.x,R.y);',
    '  float a=T*.12+(M.x-.5)*3.2;float b=.25+(M.y-.5)*1.6;',
    '  float dist=2.55-.15*sin(T*.2);',
    '  vec3 ro=dist*vec3(cos(a)*cos(b),sin(b),sin(a)*cos(b));',
    '  vec3 ww=normalize(-ro);vec3 uu=normalize(cross(vec3(0,1,0),ww));vec3 vv=cross(ww,uu);',
    '  vec3 rd=normalize(uv.x*uu+uv.y*vv+1.7*ww);',
    '  vec3 bg=mix(vec3(.02,.015,.05),vec3(.10,.05,.16),.5+.5*uv.y);',
    '  bg+=vec3(.25,.08,.3)*pow(max(0.,1.-length(uv-vec2(.5,.4))*.8),3.);',
    '  bg+=vec3(.05,.18,.25)*pow(max(0.,1.-length(uv+vec2(.7,.3))*.9),3.);',
    '  float t=0.;float d;int hit=0;float steps=0.;',
    '  float tb=dot(-ro,rd);float bc=dot(ro,ro)-1.44;float disc=tb*tb-bc;',
    '  if(disc>0.){t=max(0.,tb-sqrt(disc));',
    '  for(int i=0;i<88;i++){vec3 p=ro+rd*t;d=DE(p);if(d<.0009*t){hit=1;break;}t+=d*.9;steps+=1.;if(t>5.)break;}}',
    '  vec3 col=bg;',
    '  if(hit==1){',
    '    vec3 p=ro+rd*t;vec3 n=nrm(p);',
    '    float ao=clamp(1.-steps/70.,0.,1.);ao=pow(ao,1.5);',
    '    float tg=sqrt(trapG);',
    '    vec3 base=pal(tg*.9+trapC.x*.6+T*.03);',
    '    base=mix(base,vec3(1.,.55,.25),clamp(trapC.y*1.4,0.,1.)*.45);',
    '    vec3 L=normalize(vec3(.6,.8,-.4));',
    '    float dif=max(dot(n,L),0.);float back=max(dot(n,-L),0.);',
    '    float fr=pow(1.-max(dot(n,-rd),0.),3.);',
    '    vec3 h=normalize(L-rd);float sp=pow(max(dot(n,h),0.),40.);',
    '    vec3 irid=pal(dot(n,-rd)*1.5+tg+.3);',
    '    col=base*(.18+.9*dif)*ao+vec3(.4,.2,.6)*back*.3*ao;',
    '    col+=irid*fr*.9*ao+sp*vec3(1.,.95,.9)*.8*ao;',
    '    col=mix(col,bg,1.-exp(-.25*max(t-1.2,0.)*max(t-1.2,0.)));',
    '  }',
    '  col+=vec3(.35,.15,.5)*pow(clamp(steps/88.,0.,1.),2.)*.5*(1.-float(hit));',
    '  col*=1.-.35*dot(uv*.6,uv*.6);',
    '  col=pow(col,vec3(.4545));',
    '  gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  (window.SPECIMENS = window.SPECIMENS || []).push({
    id: 'mandelbulb',
    name: 'Raymarched Mandelbulb',
    family: 'Shader',
    tags: ['webgl', 'raymarching', '3d', 'fractal'],
    blurb: 'A 3D fractal that looks like a carved alien sculpture, shimmering with oil-slick color as it slowly turns. Every bump has smaller bumps on it, forever.',
    how: 'Raymarching (stepping each pixel\'s ray forward by the distance to the nearest surface) traces a distance function of the Mandelbulb, and orbit traps (tracking how close the math gets to fixed points) paint the color.',
    useFor: 'hero backgrounds, sci-fi title screens, album art',
    interact: 'Move to orbit the camera',
    init: function (host, api) {
      var g = glSpec(host, FS, api.reduced ? 0.4 : 0.55);
      var sx = 0.5, sy = 0.5;
      return {
        frame: function (t, dt) {
          var p = api.pointer;
          var tx = p.inside ? p.nx : 0.5, ty = p.inside ? 1 - p.ny : 0.5;
          var k = 1 - Math.exp(-(dt || 0.016) * 3);
          sx += (tx - sx) * k; sy += (ty - sy) * k;
          g.draw(api.reduced ? t * 0.3 : t, [sx, sy, 0, 0]);
        },
        resize: function (w, h) { g.resize(w, h); },
        destroy: function () { g.destroy(); }
      };
    }
  });
})();
