/* SVG art for the screen-print court. Rasterized once; gameplay stays in game.js. */
(() => {
  const assetBase = new URL('art/', document.currentScript.src);
  const ink = '#202d35';
  const paper = '#f0d8a8';
  const palettes = [
    null,
    {sky:'#23334a',skyMid:'#465266',skyLow:'#9c7c7b',far:'#7c7c8c',building:'#344f5a',buildingAlt:'#48636a',warm:'#a87867',accent:'#e6a16e',court:'#3a5758',courtDark:'#2c4047',paint:'#e4cda5',window:'#e0b77f',night:true},
    {sky:'#67617d',skyMid:'#b78089',skyLow:'#dfb095',far:'#a68e97',building:'#4e6770',buildingAlt:'#657c7b',warm:'#b77f69',accent:'#e8a16b',court:'#51666a',courtDark:'#364e55',paint:'#efd6aa',window:'#eac393'},
    {sky:'#c7d8d2',skyMid:'#d4d9bf',skyLow:'#e3c8a4',far:'#a1b4ae',building:'#53787a',buildingAlt:'#71918b',warm:'#c88b6c',accent:'#d68b58',court:'#597272',courtDark:'#3c555b',paint:'#f3dfb5',window:'#efd3a0'},
    {sky:'#727b8e',skyMid:'#c5a08a',skyLow:'#e2b88d',far:'#9c9091',building:'#4d6b70',buildingAlt:'#6d8280',warm:'#b67960',accent:'#eda164',court:'#5c6965',courtDark:'#3e5055',paint:'#efd7a9',window:'#f2c88b'},
    {sky:'#182139',skyMid:'#343d59',skyLow:'#68687f',far:'#70728d',building:'#344c60',buildingAlt:'#496677',warm:'#947779',accent:'#d2998c',court:'#344b5d',courtDark:'#263949',paint:'#c3d5c2',window:'#a9c9c5',night:true,space:true},
    {sky:'#29243d',skyMid:'#51415e',skyLow:'#987280',far:'#89748d',building:'#425064',buildingAlt:'#607071',warm:'#a77a76',accent:'#e0a278',court:'#4c505f',courtDark:'#323c4b',paint:'#e5cbad',window:'#d7c69e',night:true,space:true}
  ];

  function colorCourt(svg, palette) {
    const fills = {...palette, ink, paper};
    const fillRules = Object.entries(fills).filter(([,value]) => typeof value === 'string')
      .map(([key,value]) => `.${key}{fill:${value}}`).join('');
    return svg.replace('</style>', `${fillRules}
      .inkLine{stroke:${ink}}.paperLine{stroke:${paper}}.paintLine{stroke:${palette.paint}}.accentLine{stroke:${palette.accent}}
      .night-only{display:${palette.night ? 'inline' : 'none'}}.day-only{display:${palette.night ? 'none' : 'inline'}}.space-only{display:${palette.space ? 'inline' : 'none'}}
      </style>`);
  }

  function rasterize(svg, width, height) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const surface = document.createElement('canvas');
        surface.width = width;
        surface.height = height;
        surface.getContext('2d').drawImage(image, 0, 0, width, height);
        resolve(surface);
      };
      image.onerror = () => reject(new Error('Could not render poster SVG'));
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });
  }

  function buildHoop({hoop, hoopStructure, floorY}) {
    const {board, boardShadow, arm, post, base} = hoopStructure;
    const x = hoop.x - hoop.rimRadius - 4;
    const y = board.y - 4;
    const width = base.x + base.w + 4 - x;
    const height = floorY + 4 - y;
    const rect = (r, fill, stroke = ink) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}">
      <defs><pattern id="metalDots" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".5" fill="${ink}" opacity=".3"/></pattern></defs>
      <g stroke-linejoin="round" stroke-linecap="round">
      ${rect(post, '#577e7d')}
      <path d="M${post.x+3} ${post.y+3}v${post.h-6}" stroke="#b0bc9d" stroke-width="2"/>
      <path d="M${post.x+post.w-3} ${post.y+4}v${post.h-7}" stroke="#315459" stroke-width="3"/>
      <path d="${arm.map((p,i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')}Z" fill="#849a8d" stroke="${ink}" stroke-width="3"/>
      <path d="M${arm[1].x+3} ${arm[1].y+3} ${arm[0].x-3} ${arm[0].y+3}" fill="none" stroke="${paper}" stroke-width="1.2" opacity=".65"/>
      <circle cx="${post.x+6}" cy="${post.y+17}" r="2" fill="${ink}"/><circle cx="${post.x+6}" cy="${post.y+17}" r=".7" fill="${paper}"/>
      ${rect(base, '#35565d')}
      <path d="M${base.x+3} ${base.y+4}h${base.w-6}v7h-${base.w-6}Z" fill="#83988d"/>
      <path d="M${base.x+2} ${base.y+base.h-18}h${base.w-4}v16h-${base.w-4}Z" fill="#253d46"/>
      <rect x="${base.x+4}" y="${base.y+16}" width="${base.w-8}" height="${base.h-20}" fill="url(#metalDots)"/>
      <text x="${base.x+base.w/2}" y="${base.y+38}" text-anchor="middle" font-family="'Courier New',monospace" font-weight="bold" font-size="12" letter-spacing="3" fill="${paper}" opacity=".75">TJ</text>
      <rect x="${boardShadow.x}" y="${boardShadow.y}" width="${boardShadow.w}" height="${boardShadow.h}" fill="#466c73"/>
      ${rect(board, '#e8d2a5')}
      <path d="M${board.x+3} ${board.y+4}h4v${board.h-8}h-4Z" fill="#faf0cd"/>
      <path d="M${board.x+board.w-6} ${board.y+4}h3v${board.h-8}h-3Z" fill="#8aa6a0"/>
      <rect x="${board.x+4}" y="${hoop.y-40}" width="${board.w-8}" height="27" fill="none" stroke="#bc7458" stroke-width="1.8"/>
      <path d="M${board.x+5} ${board.y+9}h${board.w-10}m-${board.w-10} ${board.h-18}h${board.w-10}" stroke="${ink}" stroke-width="1.1" opacity=".55"/>
      <path d="M${hoop.x} ${hoop.y}Q${hoop.x+hoop.rimGap/2} ${hoop.y-1.5} ${hoop.x+hoop.rimGap} ${hoop.y}" fill="none" stroke="${ink}" stroke-width="7"/>
      <path d="M${hoop.x} ${hoop.y-1}Q${hoop.x+hoop.rimGap/2} ${hoop.y-2} ${hoop.x+hoop.rimGap} ${hoop.y-1}" fill="none" stroke="#e99961" stroke-width="4"/>
      ${[hoop.x,hoop.x+hoop.rimGap].map(rx => `<circle cx="${rx}" cy="${hoop.y}" r="8" fill="#d78859" stroke="${ink}" stroke-width="2"/><path d="M${rx-4} ${hoop.y-3}h7" stroke="${paper}" stroke-width="1.4"/>`).join('')}
      </g></svg>`;
    return {svg, x, y, width, height};
  }

  function drawNet(ctx, {hoop, netJiggle, netJigglePhase}) {
    const top = hoop.y + 4;
    const jiggleX = Math.sin(netJigglePhase * 1.8) * 4.4 * netJiggle;
    const bottom = hoop.y + 56 + Math.abs(Math.sin(netJigglePhase * 2.2)) * 7 * netJiggle;
    const left = hoop.x + 3;
    const right = hoop.x + hoop.rimGap - 3;
    const endLeft = hoop.x + 11 + jiggleX;
    const endRight = hoop.x + hoop.rimGap - 11 + jiggleX;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(240, 216, 168, 0.07)';
    ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(endLeft,bottom);ctx.quadraticCurveTo((endLeft+endRight)/2,bottom+5,endRight,bottom);ctx.lineTo(right,top);ctx.closePath();ctx.fill();
    const mesh = new Path2D();
    for (let i=0;i<=6;i++) {
      const t=i/6, sx=left+(right-left)*t, ex=endLeft+(endRight-endLeft)*t;
      mesh.moveTo(sx,top);mesh.quadraticCurveTo(sx+(ex-sx)*0.7+jiggleX*.3,top+(bottom-top)*.55,ex,bottom);
    }
    for (let row=1;row<5;row++) {
      const t=row/5, yy=top+(bottom-top)*t;
      const lx=left+(endLeft-left)*t, rx=right+(endRight-right)*t;
      mesh.moveTo(lx,yy);mesh.quadraticCurveTo((lx+rx)/2,yy+3+t*2,rx,yy);
    }
    ctx.strokeStyle='rgba(32,45,53,.6)';ctx.lineWidth=3.1;ctx.stroke(mesh);
    ctx.strokeStyle=paper;ctx.lineWidth=1.25;ctx.stroke(mesh);
    ctx.beginPath();ctx.moveTo(endLeft,bottom);ctx.quadraticCurveTo((endLeft+endRight)/2,bottom+5,endRight,bottom);ctx.lineWidth=1.8;ctx.stroke();
    ctx.restore();
  }

  function drawPlayer(ctx, body, state) {
    const {player, charging, charge, dribbleHeld, dribblePhase, handBall, ball} = state;
    const {x:px,y:py}=player;
    const bob=dribbleHeld ? Math.sin(dribblePhase)*1.6 : 0;
    const lean=charging ? -4-charge*5 : (dribbleHeld ? 1.5 : 0);
    const rx=charging ? handBall.x-6+charge*4 : (dribbleHeld ? ball.x-5 : handBall.x-5);
    const ry=charging ? handBall.y-10-charge*10 : (dribbleHeld ? ball.y-7 : handBall.y-8);
    ctx.save();
    ctx.fillStyle='rgba(24,39,44,.25)';ctx.beginPath();ctx.ellipse(px+1,py+57,33,5,0,0,Math.PI*2);ctx.fill();
    ctx.lineCap='round';ctx.lineJoin='round';
    // Legs stay planted while the torso leans into the charge.
    const legs = new Path2D();legs.moveTo(px-9,py+32);legs.lineTo(px-12,py+51);legs.moveTo(px+9,py+32);legs.lineTo(px+17,py+51);
    ctx.strokeStyle=ink;ctx.lineWidth=9;ctx.stroke(legs);ctx.strokeStyle='#d7a77a';ctx.lineWidth=5;ctx.stroke(legs);
    ctx.strokeStyle=paper;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(px-12,py+45);ctx.lineTo(px-12,py+51);ctx.moveTo(px+15,py+45);ctx.lineTo(px+17,py+51);ctx.stroke();
    for(const [sx,sy] of [[px-14,py+52],[px+15,py+52]]) {
      ctx.fillStyle='#d4815f';ctx.strokeStyle=ink;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(sx-5,sy-2);ctx.lineTo(sx+4,sy-2);ctx.lineTo(sx+12,sy+3);ctx.lineTo(sx+12,sy+6);ctx.lineTo(sx-6,sy+6);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle=paper;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx-4,sy+4);ctx.lineTo(sx+10,sy+4);ctx.moveTo(sx+1,sy);ctx.lineTo(sx+5,sy+1);ctx.stroke();
    }
    const arms=new Path2D();arms.moveTo(px+5+lean,py-6+bob*.2);arms.quadraticCurveTo(px+24+lean*.4,py-4-charge*3,rx,ry);arms.moveTo(px-10+lean,py-4+bob*.2);arms.quadraticCurveTo(px-24+lean*.5,py+13,px-24+lean*.5,py+2+bob*.1);
    ctx.strokeStyle=ink;ctx.lineWidth=9;ctx.stroke(arms);ctx.strokeStyle='#e5b988';ctx.lineWidth=5.4;ctx.stroke(arms);
    ctx.drawImage(body,px-42+lean,py-64+bob*.2,96,100);
    ctx.fillStyle='#edc596';ctx.strokeStyle=ink;ctx.lineWidth=1.4;
    for(const [hx,hy] of [[rx,ry],[px-24+lean*.5,py+2+bob*.1]]) {ctx.beginPath();ctx.ellipse(hx,hy,4,3.5,-.2,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.restore();
  }

  window.TootsJamPosterArt = {
    create(config) {
      const art = {ready:false, error:null, courts:[], body:null, hoop:null};
      const hoop = buildHoop(config);
      const readSvg = async name => {
        const response=await fetch(new URL(name,assetBase));
        if(!response.ok) throw new Error(`Could not load ${name}`);
        return response.text();
      };
      art.readyPromise=Promise.all([readSvg('poster-court.svg?v=7872b08ddc900005'),readSvg('poster-player.svg?v=bdeed883c6c87faa')])
        .then(async ([courtSvg,bodySvg]) => {
          const results=await Promise.all([
            ...palettes.slice(1).map(palette=>rasterize(colorCourt(courtSvg,palette),config.W,config.H)),
            rasterize(bodySvg,192,200),rasterize(hoop.svg,hoop.width*2,hoop.height*2)
          ]);
          art.courts=[null,...results.slice(0,6)];art.body=results[6];art.hoop=results[7];art.ready=true;return true;
        }).catch(error=>{art.error=error.message;console.warn('Poster art fallback:',error.message);return false;});
      art.drawCourt=(ctx,level)=>ctx.drawImage(art.courts[level] || art.courts[1],0,0,config.W,config.H);
      art.drawHoop=(ctx,state)=>{ctx.drawImage(art.hoop,hoop.x,hoop.y,hoop.width,hoop.height);drawNet(ctx,state);};
      art.drawPlayer=(ctx,state)=>drawPlayer(ctx,art.body,state);
      return art;
    }
  };
})();
