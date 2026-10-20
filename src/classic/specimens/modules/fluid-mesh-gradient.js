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
    'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'vec3 lin(vec3 c){return c*c;}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/R;float asp=R.x/R.y;vec2 p=vec2((uv.x-.5)*asp,uv.y-.5);',
    '  float t=T*.11;',
    // bend the space with slow layered sine warps (the Stripe fold)
    '  vec2 q=p;',
    '  q+=.16*vec2(sin(q.y*2.3+t*3.1),cos(q.x*1.9-t*2.4));',
    '  q+=.08*vec2(sin(q.y*4.1-t*2.2+1.3),sin(q.x*3.7+t*1.7));',
    '  vec2 P[6];vec3 C[6];',
    '  P[0]=vec2(M.x,M.y);',
    '  P[1]=vec2(-.55*asp*.6+.25*sin(t*1.3),.30+.18*cos(t*1.1));',
    '  P[2]=vec2(.50*asp*.6+.22*cos(t*.9),.28+.16*sin(t*1.4+1.));',
    '  P[3]=vec2(-.35*asp*.6+.2*sin(t*1.7+2.),-.32+.15*cos(t*1.2));',
    '  P[4]=vec2(.42*asp*.6+.25*sin(t*1.1+4.),-.30+.2*sin(t*.8+3.));',
    '  P[5]=vec2(.25*sin(t*.7+5.)*asp*.5,.05+.25*cos(t*.9+2.));',
    '  C[0]=lin(vec3(1.,.42,.36));',
    '  C[1]=lin(vec3(.36,.24,.98));',
    '  C[2]=lin(vec3(1.,.72,.30));',
    '  C[3]=lin(vec3(.10,.82,.84));',
    '  C[4]=lin(vec3(.94,.24,.66));',
    '  C[5]=lin(vec3(.99,.62,.52));',
    '  vec3 acc=vec3(0.);float ws=0.;',
    '  for(int i=0;i<6;i++){vec2 d=q-P[i];float k=i==0?2.4:(i==5?3.6:1.6);float w=exp(-dot(d,d)*k*2.6)+.001;w=w*w*w;acc+=C[i]*w;ws+=w;}',
    '  vec3 col=acc/ws;',
    // soft fold shading: light and shadow along the bends
    '  float fold=sin(q.x*2.2+q.y*3.1+t*2.)*.5+.5;',
    '  col*=.78+.34*fold;float lum=dot(col,vec3(.3,.59,.11));col=mix(vec3(lum),col,1.7);col=max(col,0.);float mxc=max(col.r,max(col.g,col.b)),mnc=min(col.r,min(col.g,col.b));float sat=(mxc-mnc)/(mxc+.001);col=mix(col,vec3(.78,.42,.96)*(lum*1.25+.08),pow(1.-sat,2.)*.9);',
    '  col+=vec3(.05,.03,.08)*pow(1.-fold,3.);',
    '  col=sqrt(max(col,0.));',
    // gentle highlight bloom near the pointer color
    '  float pg=exp(-dot(q-P[0],q-P[0])*14.);col+=vec3(1.,.8,.7)*pg*.12;',
    // vignette + film grain
    '  vec2 v=uv-.5;col*=1.-dot(v,v)*.35;',
    '  float g=h21(gl_FragCoord.xy+fract(T*7.)*vec2(91.,37.))-.5;',
    '  col+=g*.055;',
    '  gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  (window.SPECIMENS = window.SPECIMENS || []).push({
    id: 'mesh-gradient',
    name: 'Mesh Gradient',
    family: 'Fluid',
    tags: ['webgl', 'gradient', 'grain', 'brand'],
    blurb: 'Soft pools of coral, violet, teal and gold melt into one another and slowly drift, like colored silk folding in a breeze. A fine film grain keeps it feeling printed rather than digital.',
    how: 'Six color points float around the screen and every pixel blends their colors by how close it is; the space itself is bent by slow sine waves (smooth up and down curves) so the blends fold and flow.',
    useFor: 'SaaS hero sections, app onboarding, brand backdrops',
    interact: 'Move to pull the coral color point around',
    init: function (host, api) {
      var S = glSpec(host, FS, 0.5, '#4b2a8a');
      var mx = 0.1, my = 0.0;
      return {
        frame: function (t, dt) {
          var T = api.reduced ? t * 0.3 : t;
          var w = host.clientWidth || 1, h = host.clientHeight || 1, asp = w / h, p = api.pointer;
          var tx, ty;
          if (p && p.inside) { tx = (p.nx - 0.5) * asp; ty = 0.5 - p.ny; }
          else { tx = 0.25 * Math.sin(T * 0.2) * asp; ty = 0.15 * Math.cos(T * 0.17); }
          var k = 1 - Math.exp(-(dt || 0.016) * 2.2);
          mx += (tx - mx) * k; my += (ty - my) * k;
          S.draw(T, [mx, my, 0, 0]);
        },
        resize: function (w, h) { S.resize(w, h); },
        destroy: function () { S.destroy(); }
      };
    }
  });
})();
