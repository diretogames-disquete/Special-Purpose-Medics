/* Body diagram - photographic anatomical front/back view */
/* global React */

const BODY_W = 200;
const BODY_H = 440;

/* Rough body silhouette path (front & back same shape). Used as a clip-path
   so burn regions / freeform drawings stay within the body outline. */
const SILHOUETTE_PATH = "M 100 2 Q 116 2 122 16 L 122 44 Q 118 58 113 68 L 121 73 L 145 77 L 168 86 L 175 100 L 180 150 L 182 212 L 180 240 L 164 244 L 159 236 L 152 225 L 146 232 L 144 258 L 140 290 L 135 360 L 132 420 L 124 428 L 106 428 L 106 264 L 100 262 L 94 264 L 94 428 L 76 428 L 68 420 L 65 360 L 60 290 L 56 258 L 54 232 L 48 225 L 41 236 L 36 244 L 20 240 L 18 212 L 20 150 L 25 100 L 32 86 L 55 77 L 79 73 L 87 68 Q 82 58 78 44 L 78 16 Q 84 2 100 2 Z";

/* TQ catalog */
const TQ_TYPES = ['CAT', 'SOFT-T', 'SOFT-T WIDE', 'SAM-XT', 'TMT', 'RATS', 'Junctional', 'Improvised'];
const TQ_POSITIONS = ['Proximal', 'Mid-Limb', 'Distal', '2-3" Above Wound'];

/* Rule-of-9 regions: each entry is one half of an anatomical area on one view.
   tbsa values sum to ~100% across both views (4.5 head front + 4.5 head back +
   4 × 4.5 arm halves + 9 chest + 9 abdomen + 9 upper-back + 9 lower-back +
   4 × 9 leg halves + 1 perineum = 100). */
const BURN_REGIONS = {
  // Front view — patient's R arm is on viewer's LEFT
  'f-head':       { view: 'front', tbsa: 4.5, label: 'Head/Neck',       bbox: [72, 0, 128, 70] },
  'f-chest':      { view: 'front', tbsa: 9,   label: 'Chest',           bbox: [55, 75, 145, 158] },
  'f-abdomen':    { view: 'front', tbsa: 9,   label: 'Abdomen',         bbox: [60, 158, 140, 232] },
  'f-perineum':   { view: 'front', tbsa: 1,   label: 'Perineum',        bbox: [88, 232, 112, 262] },
  'f-rArm':       { view: 'front', tbsa: 4.5, label: 'R arm (front)',   bbox: [8, 75, 55, 245] },
  'f-lArm':       { view: 'front', tbsa: 4.5, label: 'L arm (front)',   bbox: [145, 75, 192, 245] },
  'f-rLeg':       { view: 'front', tbsa: 9,   label: 'R leg (front)',   bbox: [55, 262, 100, 428] },
  'f-lLeg':       { view: 'front', tbsa: 9,   label: 'L leg (front)',   bbox: [100, 262, 145, 428] },
  // Back view — patient's R arm is on viewer's RIGHT
  'b-head':       { view: 'back',  tbsa: 4.5, label: 'Head/Neck (back)',bbox: [72, 0, 128, 70] },
  'b-upperBack':  { view: 'back',  tbsa: 9,   label: 'Upper back',      bbox: [55, 75, 145, 158] },
  'b-lowerBack':  { view: 'back',  tbsa: 9,   label: 'Lower back',      bbox: [60, 158, 140, 250] },
  'b-rArm':       { view: 'back',  tbsa: 4.5, label: 'R arm (back)',    bbox: [145, 75, 192, 245] },
  'b-lArm':       { view: 'back',  tbsa: 4.5, label: 'L arm (back)',    bbox: [8, 75, 55, 245] },
  'b-rLeg':       { view: 'back',  tbsa: 9,   label: 'R leg (back)',    bbox: [100, 250, 145, 428] },
  'b-lLeg':       { view: 'back',  tbsa: 9,   label: 'L leg (back)',    bbox: [55, 250, 100, 428] },
};

/* TQ band geometry — where to draw the strap on each limb in each view. */
const TQ_LIMB_X = {
  front: { rArm: [12, 52], lArm: [148, 188], rLeg: [58, 98],  lLeg: [102, 142] },
  back:  { rArm: [148, 188], lArm: [12, 52], rLeg: [102, 142], lLeg: [58, 98] },
};
const TQ_LIMB_Y = { arm: [82, 238], leg: [266, 422] };
const TQ_POS_FRAC = {
  'Proximal':         0.15,
  'Mid-Limb':         0.45,
  'Distal':           0.78,
  '2-3" Above Wound': 0.55,
};
function tqBand(view, limb, position) {
  const isArm = limb.includes('Arm');
  const [y0, y1] = TQ_LIMB_Y[isArm ? 'arm' : 'leg'];
  const frac = TQ_POS_FRAC[position] != null ? TQ_POS_FRAC[position] : 0.45;
  const cy = y0 + (y1 - y0) * frac;
  const [x0, x1] = TQ_LIMB_X[view][limb];
  const pad = 4; // overscan; clip-path trims to silhouette
  return { x: x0 - pad, y: cy - 4, w: (x1 - x0) + pad * 2, h: 8, cx: (x0 + x1) / 2, cy };
}

function BodyView({ view, injuries, burnedRegions, burnMode, tool, tourniquets, onAdd, onToggleRegion, draftPatch, onPatchStart, onPatchMove, onPatchEnd }) {
  const svgRef = React.useRef(null);
  const clipId = 'silhouette-clip-' + view;

  const toLocal = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const c = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: c.x, y: c.y };
  };

  const handleClick = (e) => {
    if (!tool || tool === 'none' || tool === 'burn') return;
    const { x, y } = toLocal(e);
    onAdd({ view, x, y, type: tool, t: Date.now() });
  };

  // Pointer handlers for freeform burn outline
  const handleDown = (e) => {
    if (tool === 'burn' && burnMode === 'outline') {
      const { x, y } = toLocal(e);
      onPatchStart({ view, points: [{ x, y }] });
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
  };
  const handleMove = (e) => {
    if (tool === 'burn' && burnMode === 'outline' && draftPatch && draftPatch.view === view) {
      const { x, y } = toLocal(e);
      onPatchMove({ x, y });
    }
  };
  const handleUp = (e) => {
    if (tool === 'burn' && burnMode === 'outline' && draftPatch && draftPatch.view === view) {
      onPatchEnd();
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };

  const imgHref = view === 'front'
    ? ((window.__resources && window.__resources.bodyFront) || 'body-front.png')
    : ((window.__resources && window.__resources.bodyBack)  || 'body-back.png');

  const regions = Object.entries(BURN_REGIONS).filter(([, r]) => r.view === view);

  const draftPoints = (draftPatch && draftPatch.view === view)
    ? draftPatch.points.map(p => `${p.x},${p.y}`).join(' ')
    : '';

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${BODY_W} ${BODY_H}`}
      preserveAspectRatio="xMidYMid meet"
      onClick={handleClick}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      style={{ touchAction: 'none' }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={SILHOUETTE_PATH} />
        </clipPath>
      </defs>

      <image
        href={imgHref}
        x="0" y="0" width={BODY_W} height={BODY_H}
        preserveAspectRatio="xMidYMid meet"
        className="body-img"
      />

      {/* All burn fills + hits clipped to body silhouette */}
      <g clipPath={`url(#${clipId})`}>
        {/* Selected burn regions */}
        {regions.filter(([key]) => burnedRegions && burnedRegions.includes(key)).map(([key, r]) => {
          const [x1, y1, x2, y2] = r.bbox;
          return (
            <rect key={'fill-' + key}
              x={x1} y={y1} width={x2 - x1} height={y2 - y1}
              className="burn-region-fill"
            />
          );
        })}

        {/* Existing freeform burn patches */}
        {(injuries || []).filter(i => i.view === view && i.type === 'burn' && i.points).map((i, idx) => (
          <polygon
            key={'bp' + idx}
            points={i.points.map(p => `${p.x},${p.y}`).join(' ')}
            className="burn-patch"
          />
        ))}

        {/* Live draft burn outline */}
        {draftPoints && (
          <polyline points={draftPoints} className="burn-patch draft" />
        )}

        {/* Hit targets (only in region mode) */}
        {tool === 'burn' && burnMode === 'regions' && regions.map(([key, r]) => {
          const [x1, y1, x2, y2] = r.bbox;
          const active = burnedRegions && burnedRegions.includes(key);
          return (
            <rect key={'hit-' + key}
              x={x1} y={y1} width={x2 - x1} height={y2 - y1}
              className={'burn-region-hit ' + (active ? 'active' : '')}
              onClick={(e) => { e.stopPropagation(); onToggleRegion(key); }}
            >
              <title>{r.label} · {r.tbsa}%</title>
            </rect>
          );
        })}

        {/* Tourniquet bands — clipped to silhouette so they hug the limb */}
        {tourniquets && ['rArm','lArm','rLeg','lLeg'].map(limb => {
          const tq = tourniquets[limb];
          if (!tq || !tq.active) return null;
          const b = tqBand(view, limb, tq.position);
          return (
            <g key={'tq-band-' + limb}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} className="tq-band" />
              <rect x={b.x} y={b.y + 2.5} width={b.w} height={1} className="tq-band-stripe" />
              <rect x={b.x} y={b.y + 4.5} width={b.w} height={1} className="tq-band-stripe" />
            </g>
          );
        })}
      </g>

      {/* TQ buckle + label — outside clip so it sits ON the limb but the type tag stays visible */}
      {tourniquets && ['rArm','lArm','rLeg','lLeg'].map(limb => {
        const tq = tourniquets[limb];
        if (!tq || !tq.active) return null;
        const b = tqBand(view, limb, tq.position);
        const isLeftHalf = b.cx < BODY_W / 2;
        const tagX = isLeftHalf ? b.x + b.w + 4 : b.x - 4;
        const anchor = isLeftHalf ? 'start' : 'end';
        const label = (tq.type || 'TQ').replace(' WIDE', '');
        return (
          <g key={'tq-tag-' + limb} className="tq-tag">
            <circle cx={b.cx} cy={b.cy} r="2.4" className="tq-buckle" />
            <text x={tagX} y={b.cy + 3} textAnchor={anchor} className="tq-band-lbl">{label}</text>
          </g>
        );
      })}

      {/* Region labels — drawn OUTSIDE the clip so % labels stay visible even
          when they'd fall on the edge of a clipped region. */}
      {tool === 'burn' && burnMode === 'regions' && regions.map(([key, r]) => {
        const [x1, y1, x2, y2] = r.bbox;
        return (
          <text
            key={'lbl-' + key}
            x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 2}
            className="burn-region-lbl"
            style={{ pointerEvents: 'none' }}
          >{r.tbsa}%</text>
        );
      })}

      {/* Point markers (gsw, frac, legacy burn-point) */}
      {(injuries || []).filter(i => i.view === view).map((i, idx) => {
        if (i.type === 'gsw' || i.type === 'shrap') {
          return (
            <g key={idx}>
              <circle cx={i.x} cy={i.y} r="5" className="injury" />
              <circle cx={i.x} cy={i.y} r="1.6" fill="#fff" />
            </g>
          );
        }
        if (i.type === 'burn' && !i.points) {
          return (
            <g key={idx}>
              <circle cx={i.x} cy={i.y} r="6" className="injury burn" opacity="0.7" />
              <circle cx={i.x} cy={i.y} r="3" fill="var(--amber)" />
            </g>
          );
        }
        if (i.type === 'frac') {
          return (
            <g key={idx} className="injury">
              <path
                d={`M ${i.x-5} ${i.y-5} L ${i.x+5} ${i.y+5} M ${i.x+5} ${i.y-5} L ${i.x-5} ${i.y+5}`}
                stroke="var(--crit)" strokeWidth="2" fill="none"
              />
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
}

function BodyDiagram({ injuries, setInjuries, tourniquets, setTourniquets, burnedRegions, setBurnedRegions, weightKg }) {
  const [tool, setTool] = React.useState('gsw');
  const [burnMode, setBurnMode] = React.useState('regions'); // 'regions' | 'outline'
  const [draftPatch, setDraftPatch] = React.useState(null);

  const regions = burnedRegions || [];
  const tbsa = estimateBurnTBSA(injuries, regions);
  const pk = tbsa > 0 ? parkland(tbsa, weightKg) : null;
  const regionCount = regions.length;

  const toggleRegion = (key) => {
    setBurnedRegions(prev => {
      const arr = prev || [];
      return arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key];
    });
  };

  const onPatchStart = (p) => setDraftPatch(p);
  const onPatchMove = (pt) => setDraftPatch(prev => {
    if (!prev) return prev;
    const last = prev.points[prev.points.length - 1];
    if (last && Math.hypot(pt.x - last.x, pt.y - last.y) < 1.5) return prev;
    return { ...prev, points: [...prev.points, pt] };
  });
  const onPatchEnd = () => {
    setDraftPatch(prev => {
      if (prev && prev.points.length >= 3) {
        setInjuries(curr => [...curr, {
          view: prev.view, type: 'burn', points: prev.points, t: Date.now()
        }]);
      }
      return null;
    });
  };

  const addInjury = (inj) => setInjuries(prev => [...prev, inj]);
  const undoLast = () => {
    if (tool === 'burn') {
      if (burnMode === 'regions') {
        setBurnedRegions(prev => (prev && prev.length) ? prev.slice(0, -1) : prev);
      } else {
        // remove the last burn polygon patch
        setInjuries(prev => {
          const lastBurnIdx = [...prev].map(i => i.type === 'burn' && i.points).lastIndexOf(true);
          if (lastBurnIdx < 0) return prev;
          return prev.filter((_, i) => i !== lastBurnIdx);
        });
      }
    } else {
      setInjuries(prev => prev.slice(0, -1));
    }
  };
  const clearAll = () => {
    setInjuries([]);
    setBurnedRegions([]);
  };

  const toggleTQ = (k) => {
    setTourniquets(prev => ({
      ...prev,
      [k]: {
        ...prev[k],
        active: !prev[k].active,
        time: !prev[k].active ? nowHHMM() : prev[k].time,
        type: !prev[k].active && !prev[k].type ? 'CAT' : prev[k].type,
        position: !prev[k].active && !prev[k].position ? 'Proximal' : (prev[k].position || ''),
      }
    }));
  };
  const updateTQ = (k, field, val) => {
    setTourniquets(prev => ({ ...prev, [k]: { ...prev[k], [field]: val } }));
  };

  return (
    <div>
      <div className="body-tools">
        <button className={tool==='gsw'?'active':''} onClick={()=>setTool('gsw')}>
          <span className="swatch" style={{background:'var(--crit)'}}></span>GSW
        </button>
        <button className={tool==='burn'?'active':''} onClick={()=>setTool('burn')} title="Click Rule-of-9 regions or draw a freeform outline">
          <span className="swatch" style={{background:'var(--amber)'}}></span>Burn
        </button>
        <button className={tool==='frac'?'active':''} onClick={()=>setTool('frac')}>
          <span className="swatch" style={{background:'var(--crit)', borderRadius:'1px'}}></span>Frac
        </button>
        <button onClick={undoLast} title="Undo last">⟲ Undo</button>
        <button onClick={clearAll} title="Clear all markers">⨯ Clear</button>
      </div>

      {tool === 'burn' && (
        <div className="burn-mode-bar">
          <span className="burn-mode-lbl">BURN MODE</span>
          <button
            className={'burn-mode-btn ' + (burnMode==='regions' ? 'active' : '')}
            onClick={() => setBurnMode('regions')}
          >REGIONS</button>
          <button
            className={'burn-mode-btn ' + (burnMode==='outline' ? 'active' : '')}
            onClick={() => setBurnMode('outline')}
          >OUTLINE</button>
          <span className="burn-mode-hint">
            {burnMode === 'regions' ? 'Tap a quadrant · Rule of 9' : 'Drag to draw — stays inside body lines'}
          </span>
        </div>
      )}

      <div className="body-wrap">
        <div className="body-view">
          <div className="lbl">ANT</div>
          <div className="lbl lbl-r">FRONT</div>
          <BodyView
            view="front"
            injuries={injuries}
            burnedRegions={regions}
            burnMode={burnMode}
            tool={tool}
            tourniquets={tourniquets}
            onAdd={addInjury}
            onToggleRegion={toggleRegion}
            draftPatch={draftPatch}
            onPatchStart={onPatchStart}
            onPatchMove={onPatchMove}
            onPatchEnd={onPatchEnd}
          />
        </div>
        <div className="body-view">
          <div className="lbl">POST</div>
          <div className="lbl lbl-r">BACK</div>
          <BodyView
            view="back"
            injuries={injuries}
            burnedRegions={regions}
            burnMode={burnMode}
            tool={tool}
            tourniquets={tourniquets}
            onAdd={addInjury}
            onToggleRegion={toggleRegion}
            draftPatch={draftPatch}
            onPatchStart={onPatchStart}
            onPatchMove={onPatchMove}
            onPatchEnd={onPatchEnd}
          />
        </div>
      </div>

      <div className="tq-grid">
        {['rArm','lArm','rLeg','lLeg'].map(k => {
          const lbl = { rArm: 'TQ · R ARM', lArm: 'TQ · L ARM', rLeg: 'TQ · R LEG', lLeg: 'TQ · L LEG' }[k];
          const tq = tourniquets[k];
          return (
            <div key={k} className={'tq ' + (tq.active ? 'active' : '')}>
              <div className="tq-h" onClick={()=>toggleTQ(k)} style={{cursor:'pointer'}}>
                <span className="dot"></span>{lbl}
                <span style={{marginLeft:'auto', fontSize:'9px'}}>{tq.active ? 'APPLIED' : 'OFF'}</span>
              </div>
              <div className="tq-data">
                <span className="tq-field-lbl">Type</span>
                <select
                  className="tq-select"
                  value={tq.type || ''}
                  onChange={e => updateTQ(k, 'type', e.target.value)}
                  disabled={!tq.active}
                >
                  <option value="">—</option>
                  {TQ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="tq-data">
                <span className="tq-field-lbl">Site</span>
                <select
                  className="tq-select"
                  value={tq.position || ''}
                  onChange={e => updateTQ(k, 'position', e.target.value)}
                  disabled={!tq.active}
                >
                  <option value="">—</option>
                  {TQ_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="tq-data">
                <span className="tq-field-lbl">Time</span>
                <input
                  placeholder={tq.active ? 'HHMM' : '—'}
                  value={tq.time || ''}
                  onChange={e=>updateTQ(k, 'time', e.target.value)}
                  disabled={!tq.active}
                />
              </div>
            </div>
          );
        })}
      </div>

      {tbsa > 0 && (
        <BurnResusCard tbsa={tbsa} pk={pk} weightKg={weightKg} regionCount={regionCount} regions={regions} />
      )}
    </div>
  );
}

function BurnResusCard({ tbsa, pk, weightKg, regionCount, regions }) {
  const severity = tbsa < 10 ? 'minor' : tbsa < 20 ? 'mod' : tbsa < 40 ? 'major' : 'sev';
  const sevLabel = { minor: 'Minor', mod: 'Moderate', major: 'Major', sev: 'Severe' }[severity];

  const regionList = (regions || []).map(k => BURN_REGIONS[k]?.label).filter(Boolean);

  return (
    <div className={'burn-card burn-' + severity}>
      <div className="burn-h">
        <span className="burn-pill">BURN · Rule of 9</span>
        <span className="burn-sev">{sevLabel}</span>
      </div>

      <div className="burn-tbsa">
        <span className="burn-tbsa-val">{tbsa.toFixed(1)}<span className="burn-tbsa-u">%</span></span>
        <span className="burn-tbsa-lbl">TBSA · {regionCount} region{regionCount !== 1 ? 's' : ''}</span>
      </div>

      {regionList.length > 0 && (
        <div className="burn-regions-list">
          {regionList.map((lbl, i) => <span key={i} className="burn-region-chip">{lbl}</span>)}
        </div>
      )}

      {weightKg > 0 ? (
        <>
          <div className="burn-row burn-formula">
            <span className="k">Parkland 4 mL/kg/%</span>
            <span className="v">4 × {weightKg} × {tbsa.toFixed(1)} = <b>{pk.total.toLocaleString()} mL / 24h</b></span>
          </div>
          <div className="burn-row">
            <span className="k">First 8 h</span>
            <span className="v"><b>{pk.first8.toLocaleString()} mL</b> LR · {pk.rateFirst8} mL/hr</span>
          </div>
          <div className="burn-row">
            <span className="k">Next 16 h</span>
            <span className="v"><b>{pk.next16.toLocaleString()} mL</b> LR · {pk.rateNext16} mL/hr</span>
          </div>
          {tbsa < 20 && (
            <div className="burn-note">{'<'}20% TBSA: oral hydration usually sufficient.</div>
          )}
          {tbsa >= 20 && (
            <div className="burn-note crit">Major burn — start LR resuscitation, titrate to UOP 0.5 mL/kg/h.</div>
          )}
        </>
      ) : (
        <div className="burn-note">Set patient weight in roster to compute Parkland.</div>
      )}
    </div>
  );
}

function nowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2,'0') + String(d.getMinutes()).padStart(2,'0');
}

/* Shoelace formula — polygon area in viewBox² (kept as a fallback) */
function polygonArea(points) {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += (points[j].x + points[i].x) * (points[j].y - points[i].y);
  }
  return Math.abs(area / 2);
}

/* Pixel-accurate TBSA for freeform outlines.
   Each anatomical view (front / back) represents 50% of total body surface,
   so a freeform patch's contribution is:
     (patch ∩ silhouette pixels) / (silhouette pixels) × 50%
   We rasterize the silhouette once and clip every patch to it so polygons
   drawn outside the body don't inflate the percentage. */
let __silhouettePixelCount = null;
function getSilhouettePixelCount() {
  if (__silhouettePixelCount != null) return __silhouettePixelCount;
  try {
    const c = document.createElement('canvas');
    c.width = BODY_W; c.height = BODY_H;
    const ctx = c.getContext('2d');
    if (!ctx || typeof Path2D === 'undefined') return null;
    ctx.fillStyle = '#000';
    ctx.fill(new Path2D(SILHOUETTE_PATH));
    const data = ctx.getImageData(0, 0, BODY_W, BODY_H).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
    __silhouettePixelCount = n;
    return n;
  } catch (e) { return null; }
}

const __burnPatchPctCache = new Map();
function patchTBSAPercent(points) {
  if (!points || points.length < 3) return 0;
  // Use a stable key based on rounded coords to avoid floating-point churn
  const key = points.map(p => `${Math.round(p.x*4)},${Math.round(p.y*4)}`).join(';');
  if (__burnPatchPctCache.has(key)) return __burnPatchPctCache.get(key);

  const bodyPx = getSilhouettePixelCount();
  let pct;
  if (bodyPx && typeof Path2D !== 'undefined') {
    try {
      const c = document.createElement('canvas');
      c.width = BODY_W; c.height = BODY_H;
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.clip(new Path2D(SILHOUETTE_PATH)); // restrict to silhouette
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
      const data = ctx.getImageData(0, 0, BODY_W, BODY_H).data;
      let patchPx = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) patchPx++;
      // Each view is 50% of total body surface (front + back = 100%)
      pct = (patchPx / bodyPx) * 50;
    } catch (e) {
      // Fall through to shoelace approximation
      pct = (polygonArea(points) / (BODY_W * BODY_H * 0.40 * 2)) * 100;
    }
  } else {
    pct = (polygonArea(points) / (BODY_W * BODY_H * 0.40 * 2)) * 100;
  }
  __burnPatchPctCache.set(key, pct);
  return pct;
}

/* Sum the TBSA % values of the selected Rule-of-9 regions plus any
   freeform outline patches (measured by silhouette-clipped raster area). */
function estimateBurnTBSA(injuries, burnedRegions) {
  let total = 0;
  for (const key of (burnedRegions || [])) {
    const r = BURN_REGIONS[key];
    if (r) total += r.tbsa;
  }
  const patches = (injuries || []).filter(i => i.type === 'burn' && i.points && i.points.length >= 3);
  for (const p of patches) total += patchTBSAPercent(p.points);
  return Math.min(100, Math.max(0, total));
}

/* Parkland formula: 4 mL × kg × %TBSA in 24h, half over first 8h, half over next 16h. */
function parkland(tbsaPct, weightKg) {
  const w = Number(weightKg) || 0;
  const t = Number(tbsaPct) || 0;
  const total = 4 * w * t;
  const first8 = total / 2;
  const next16 = total / 2;
  return {
    total: Math.round(total),
    first8: Math.round(first8),
    next16: Math.round(next16),
    rateFirst8: Math.round(first8 / 8),
    rateNext16: Math.round(next16 / 16),
  };
}

Object.assign(window, { BodyDiagram, nowHHMM, estimateBurnTBSA, parkland });
