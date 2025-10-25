const snakeBands = 6;

const JUMP = {
    upMs: 140,
    flightMs: 220,
    landMs: 260,
    gapMs: 60,
    heightPct: 0.5, // jump height as percentage of element height (0.5 => 50%)
    scaleUp: 1.08
};
 
let turn = 1;
let numPlayers = 2;


function nextplayer() {
    if (turn+1> numPlayers) turn =1
    else turn +=1;
}

const _preloadFrog1 = new Image();
_preloadFrog1.src = '../images/frog1.gif';

const snakes = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const ladders = { 2: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
const board = document.getElementById('board');
const cells = document.getElementById('cells');
const rollBtn = document.getElementById('rollBtn');
const diceResult = document.getElementById('diceResult');
const status = document.getElementById('status');
let playerPos = new Array(1);
let _lastTransformedCell = null;
for (let i = 100; i >= 1; i--) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.rotate= `${(Math.random() * 2) > 1 ? Math.random() * 30 : -1 * Math.random() * 30}deg`
    const content = document.createElement('div');
    content.className = 'content';
    const numberSpan = document.createElement('span');
    numberSpan.className = 'texti';
    numberSpan.textContent = i;
    content.appendChild(numberSpan);

    if (snakes[i]) {
        const s = document.createElement('span');
        s.className = 'snake';
        content.appendChild(s);
    }
    if (ladders[i]) {
        const l = document.createElement('span');
        l.className = 'ladder';
        content.appendChild(l);
    }

    const rowFromTop = Math.floor((100 - i) / 10) + 1;
    const rowFromBottom = 11 - rowFromTop;
    const indexInRow = ((i - 1) % 10) + 1;
    const col = (rowFromBottom % 2 === 1) ? indexInRow : (11 - indexInRow);

    cell.style.gridRowStart = rowFromTop;
    cell.style.gridColumnStart = col;

    cell.id = 'cell-' + i;
    cell.appendChild(content);
    cells.appendChild(cell);
}

const svgNS = 'http://www.w3.org/2000/svg';
const ladderSVG = document.createElementNS(svgNS, 'svg');
ladderSVG.setAttribute('class', 'ladder-svg');
ladderSVG.setAttribute('style', 'position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:2; shape-rendering:crispEdges; image-rendering:pixelated');
board.appendChild(ladderSVG);

const rippleCanvas = document.createElement('canvas');
rippleCanvas.className = 'ripple-canvas';
rippleCanvas.setAttribute('style', 'position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:0; display:block');
if (cells && cells.parentElement) {
    cells.parentElement.insertBefore(rippleCanvas, cells);
} else {
    board.insertBefore(rippleCanvas, board.firstChild);
}
const rctx = rippleCanvas.getContext('2d');
const offscreen = document.createElement('canvas');
const offCtx = offscreen.getContext('2d');
let ripplePixelScale = 6;

function resizeRippleCanvas() {
    const rect = board.getBoundingClientRect();
    rippleCanvas.style.width = rect.width + 'px';
    rippleCanvas.style.height = rect.height + 'px';
    rippleCanvas.width = Math.max(1, Math.round(rect.width));
    rippleCanvas.height = Math.max(1, Math.round(rect.height));

    const offW = Math.max(1, Math.round(rect.width / ripplePixelScale));
    const offH = Math.max(1, Math.round(rect.height / ripplePixelScale));
    offscreen.width = offW;
    offscreen.height = offH;
    offCtx.imageSmoothingEnabled = false;
    rctx.imageSmoothingEnabled = false;
}

const ripples = [];
let rippleMultiplier = 0.1;

function spawnRipple(x, y) {
    const rect = board.getBoundingClientRect();
    const baseMaxR = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    const maxR = baseMaxR * rippleMultiplier;
    ripples.push({ x, y, start: performance.now(), duration: 800, maxR });
}

board.addEventListener('pointerdown', (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    const rect = board.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    spawnRipple(x, y);
});

let _rAF = null;
function renderRipples(now) {
    const rect = board.getBoundingClientRect();
    if (ripples.length === 0) {
        rctx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);
        _rAF = requestAnimationFrame(renderRipples);
        return;
    }

    const offW = offscreen.width;
    const offH = offscreen.height;
    offCtx.clearRect(0, 0, offW, offH);

    const sx = offW / rect.width;
    const sy = offH / rect.height;

    for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        const t = Math.min(1, (now - rp.start) / rp.duration);
        if (t >= 1) { ripples.splice(i, 1); continue; }
        const e = 1 - Math.pow(1 - t, 3);
        const radius = Math.max(0, rp.maxR * e);
        const alpha = 1 - t;

        const ox = rp.x * sx;
        const oy = rp.y * sy;
        const or = Math.max(1, radius * ((sx + sy) / 2));

        const grad = offCtx.createRadialGradient(ox, oy, 0, ox, oy, or);
        grad.addColorStop(0, `rgba(173,216,230,${0.45 * alpha})`);
        grad.addColorStop(0.6, `rgba(173,216,230,${0.18 * alpha})`);
        grad.addColorStop(1, `rgba(173,216,230,0)`);
        offCtx.fillStyle = grad;
        offCtx.beginPath();
        offCtx.arc(ox, oy, or, 0, Math.PI * 2);
        offCtx.fill();

        offCtx.strokeStyle = `rgba(173,216,230,${0.9 * alpha})`;
        offCtx.lineWidth = Math.max(1, 2 * (1 - t));
        offCtx.beginPath();
        offCtx.arc(ox, oy, or, 0, Math.PI * 2);
        offCtx.stroke();
    }

    rctx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);
    rctx.imageSmoothingEnabled = false;
    rctx.drawImage(offscreen, 0, 0, offW, offH, 0, 0, rippleCanvas.width, rippleCanvas.height);

    _rAF = requestAnimationFrame(renderRipples);
}

resizeRippleCanvas();
window.addEventListener('resize', () => { resizeRippleCanvas(); drawLadders(); });
if (!_rAF) _rAF = requestAnimationFrame(renderRipples);
window.addEventListener('beforeunload', () => { if (_rAF) cancelAnimationFrame(_rAF); });

function getPlayers(){

    const players = prompt("Enter number of players (1-6):", "2");
     numPlayers = parseInt(players);
     for (let p = 1; p <= numPlayers; p++) {
       
        playerPos.push(1);
         initPlayer(p);
        console.log(playerPos);
        updatePlayer(true, p);
     }
}

function getCellCenter(cellIndex) {
    const cell = document.getElementById('cell-' + cellIndex);
    if (!cell) return null;
    const boardRect = board.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    const x = rect.left - boardRect.left + rect.width / 2;
    const y = rect.top - boardRect.top + rect.height / 2;
    return { x, y };
}

function clearLadders() { while (ladderSVG.firstChild) ladderSVG.removeChild(ladderSVG.firstChild); }

function drawLadders() {
    clearLadders();
    const svgDefs = document.createElementNS(svgNS, 'defs');
    ladderSVG.appendChild(svgDefs);
    Object.keys(ladders).forEach(startStr => {
        const start = parseInt(startStr, 10);
        const end = ladders[start];
        const a = getCellCenter(start);
        const b = getCellCenter(end);
        if (!a || !b) return;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        const px = -uy;
        const py = ux;
        const railOffset = Math.min(14, Math.max(8, len * 0.06));

        const leftStartX = a.x + px * railOffset;
        const leftStartY = a.y + py * railOffset;
        const leftEndX = b.x + px * railOffset;
        const leftEndY = b.y + py * railOffset;

        const rightStartX = a.x - px * railOffset;
        const rightStartY = a.y - py * railOffset;
        const rightEndX = b.x - px * railOffset;
        const rightEndY = b.y - py * railOffset;

        const pixelSizeRail = 6
        const spacingRail = pixelSizeRail;
        const railColor = '#8B5A2B';
        const rungColor = '#C68642';

        function snap(px, py, grid) { return { x: Math.round(px / grid) * grid, y: Math.round(py / grid) * grid }; }

        function drawRail(x1, y1, x2, y2, color) {
            const dxr = x2 - x1;
            const dyr = y2 - y1;
            const llen = Math.hypot(dxr, dyr);
            const steps = Math.max(3, Math.floor(llen / spacingRail));
            let lastKey = null;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const pxr = x1 + dxr * t;
                const pyr = y1 + dyr * t;
                const s = snap(pxr, pyr, pixelSizeRail);
                const key = s.x + ',' + s.y;
                if (key === lastKey) continue;
                lastKey = key;
                const block = document.createElementNS(svgNS, 'rect');
                block.setAttribute('x', s.x - pixelSizeRail / 2);
                block.setAttribute('y', s.y - pixelSizeRail / 2);
                block.setAttribute('width', pixelSizeRail);
                block.setAttribute('height', pixelSizeRail);
                block.setAttribute('fill', color);
                block.setAttribute('shape-rendering', 'crispEdges');
                ladderSVG.appendChild(block);
            }
        }

        drawRail(leftStartX, leftStartY, leftEndX, leftEndY, railColor);
        drawRail(rightStartX, rightStartY, rightEndX, rightEndY, railColor);

        const rungCount = Math.max(3, Math.floor(len / 18));
        for (let r = 1; r < rungCount; r++) {
            const t = r / rungCount;
            const lx = leftStartX + (leftEndX - leftStartX) * t;
            const ly = leftStartY + (leftEndY - leftStartY) * t;
            const rx = rightStartX + (rightEndX - rightStartX) * t;
            const ry = rightStartY + (rightEndY - rightStartY) * t;
            const steps = Math.max(1, Math.floor(Math.hypot(rx - lx, ry - ly) / pixelSizeRail));
            for (let s = 0; s <= steps; s++) {
                const tt = s / steps;
                const bx = lx + (rx - lx) * tt;
                const by = ly + (ry - ly) * tt;
                const snapped = snap(bx, by, pixelSizeRail);
                const block = document.createElementNS(svgNS, 'rect');
                block.setAttribute('x', snapped.x - pixelSizeRail / 2);
                block.setAttribute('y', snapped.y - (pixelSizeRail / 2));
                block.setAttribute('width', pixelSizeRail);
                block.setAttribute('height', Math.max(2, Math.floor(pixelSizeRail / 2)));
                block.setAttribute('fill', rungColor);
                block.setAttribute('shape-rendering', 'crispEdges');
                ladderSVG.appendChild(block);
            }
        }
    });

    function hexToHsl(hex) {
        const h = hex.replace('#','');
        const r = parseInt(h.substring(0,2),16)/255;
        const g = parseInt(h.substring(2,4),16)/255;
        const b = parseInt(h.substring(4,6),16)/255;
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        let hue = 0, sat = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            sat = d / (1 - Math.abs(2*l - 1));
            switch(max) {
                case r: hue = ((g - b) / d) % 6; break;
                case g: hue = ((b - r) / d) + 2; break;
                case b: hue = ((r - g) / d) + 4; break;
            }
            hue = Math.round(hue * 60);
            if (hue < 0) hue += 360;
        }
        return { h: hue, s: sat, l };
    }
    function hslToCss(h, s, l) {
        return `hsl(${Math.round(h)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
    }
    const snakeKeys = Object.keys(snakes);
    const baseColor = '#ff0030';
    const baseHsl = hexToHsl(baseColor);
    const snakesCount = Math.max(1, snakeKeys.length);
    snakeKeys.forEach((startStr, snakeIndex) => {
        try {
        const start = parseInt(startStr, 10);
        const end = snakes[start];
        const a = getCellCenter(start);
        const b = getCellCenter(end);
        if (!a || !b) return;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 10) return;

        const sampleCount = Math.max(6, Math.floor(len / 14));
        const freq = Math.max(1, Math.floor(len / 120));
        const amplitude = Math.min(26, len * 0.06);
        const pts = [];
        for (let i = 0; i <= sampleCount; i++) {
            const t = i / sampleCount;
            const bx = a.x + dx * t;
            const by = a.y + dy * t;
            const ux = dx / len;
            const uy = dy / len;
            const px = -uy;
            const py = ux;
            const taper = (1 - Math.abs(2 * t - 1));
            const wave = Math.sin(t * Math.PI * 2 * freq) * amplitude * taper;
            pts.push({ x: bx + px * wave, y: by + py * wave });
        }

        function catmullRom2bezier(pts) {
            if (pts.length < 2) return '';
            if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
            const d = [];
            d.push(`M ${pts[0].x} ${pts[0].y}`);
            for (let i = 0; i < pts.length - 1; i++) {
                const p0 = i === 0 ? pts[0] : pts[i - 1];
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const p3 = i + 2 < pts.length ? pts[i + 2] : pts[pts.length - 1];
                const c1x = p1.x + (p2.x - p0.x) / 6;
                const c1y = p1.y + (p2.y - p0.y) / 6;
                const c2x = p2.x - (p3.x - p1.x) / 6;
                const c2y = p2.y - (p3.y - p1.y) / 6;
                d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`);
            }
            return d.join(' ');
        }

        const centerD = catmullRom2bezier(pts);
        if (!centerD) return;

        const tempPath = document.createElementNS(svgNS, 'path');
        tempPath.setAttribute('d', centerD);
        tempPath.setAttribute('fill', 'none');
        ladderSVG.appendChild(tempPath);
        const total = tempPath.getTotalLength();
        const pixelSize = Math.max(5, Math.min(12, Math.floor(len * 0.1)));
        const spacing = pixelSize;
        const hueStep = 40;
        const hue = (baseHsl.h + snakeIndex * hueStep) % 360;
        const sat = Math.min(0.98, Math.max(0.3, baseHsl.s));
        const light = Math.max(0.18, Math.min(0.62, baseHsl.l));
        const color = hslToCss(hue, sat, light);

        const startSat = Math.min(1, sat * 1.15);
        const startLight = Math.min(0.9, light * 1.1);
        const endSat = Math.max(0, sat * 0.9);
        const endLight = Math.max(0.05, light * 0.85);

        const boardRect = board.getBoundingClientRect();
        function snapToGrid(px, py) {
            const rx = Math.round((px) / pixelSize) * pixelSize;
            const ry = Math.round((py) / pixelSize) * pixelSize;
            return { x: rx, y: ry };
        }

        let lastPlaced = null;
        for (let L = 0; L < total; L += spacing) {
            const p = tempPath.getPointAtLength(L);
            const snapped = snapToGrid(p.x, p.y);
            const key = snapped.x + ',' + snapped.y;
            if (key === lastPlaced) continue;
            lastPlaced = key;
            const img = document.createElementNS(svgNS, 'image');
            img.setAttribute('x', snapped.x - pixelSize / 2);
            img.setAttribute('y', snapped.y - pixelSize / 2);
            img.setAttribute('width', pixelSize);
            img.setAttribute('height', pixelSize);
            img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '../images/Snakebody.png');
            img.setAttribute('href', '../images/Snakebody.png');
            img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            img.setAttribute('shape-rendering', 'crispEdges');
            const tBlock = Math.min(1, Math.max(0, L / Math.max(1, total)));
            const bandIndex = Math.floor(tBlock * snakeBands);
            const bandT = bandIndex / Math.max(1, snakeBands - 1);
            const brightness = 0.6 + bandT * 0.9;
            const hueShift = ((hue - baseHsl.h) + 360) % 360;
            const satAdjust = 1.05;
            img.style.filter = `hue-rotate(${hueShift}deg) saturate(${satAdjust}) brightness(${brightness})`;
            ladderSVG.appendChild(img);
        }

        const headP = tempPath.getPointAtLength(0);
        const snappedHead = snapToGrid(headP.x, headP.y);
        const headSize = Math.max(pixelSize * 2.4, pixelSize + 2);
        const headImg = document.createElementNS(svgNS, 'image');
        headImg.setAttribute('x', snappedHead.x - headSize / 2);
        headImg.setAttribute('y', snappedHead.y - headSize / 2);
        headImg.setAttribute('width', headSize);
        headImg.setAttribute('height', headSize);
        headImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '../images/snakehead.png');
        headImg.setAttribute('href', '../images/snakehead.png');
        headImg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        headImg.setAttribute('shape-rendering', 'crispEdges');
        headImg.setAttribute('pointer-events', 'none');
        const hueShift = ((hue - baseHsl.h) + 360) % 360;
        const satAdjust = 1.05;
        const brightness = Math.max(0.7, Math.min(1.3, 1 + (light - baseHsl.l) * 0.9));
        headImg.style.filter = `hue-rotate(${hueShift}deg) saturate(${satAdjust}) brightness(${brightness})`;
        ladderSVG.appendChild(headImg);

        tempPath.parentElement && tempPath.parentElement.removeChild(tempPath);
        } catch (err) { console.error('Error drawing snake', err); }
    });
}

drawLadders();
const ro = new ResizeObserver(drawLadders);
ro.observe(board);
window.addEventListener('resize', drawLadders);



function initPlayer(name=1) {
const floatingPlayer = document.createElement('div');
floatingPlayer.className = 'player '+name;
const playerImg = document.createElement('img');
playerImg.className = 'player-sprite';
playerImg.src = '../images/frog.gif';
playerImg.style.filter = `hue-rotate(${(parseInt(name) ) * 60}deg)`;
playerImg.alt = 'Player';
playerImg.style.width = '100%';
playerImg.style.height = '100%';
playerImg.style.display = 'block';
playerImg.style.objectFit = 'contain';
playerImg.style.imageRendering = 'pixelated';
playerImg.style.pointerEvents = 'none';
floatingPlayer.appendChild(playerImg);
board.appendChild(floatingPlayer);

const playerShadow = document.createElement('div');
playerShadow.className = 'player-shadow '+name;
playerShadow.style.left = '0px';
playerShadow.style.top = '0px';
board.appendChild(playerShadow);
}
function getCellCenterPosition(cell) {
    if (!cell) return null;
    if (typeof cell === 'number') return getCellCenter(cell);
    const id = cell.id || '';
    const m = id.match(/cell-(\d+)/);
    if (m) return getCellCenter(parseInt(m[1], 10));
    return null;
}

function updatePlayer(instant = false ,name=2) {
    const floatingPlayer = document.getElementsByClassName('player '+name)[0];
    const playerShadow = document.getElementsByClassName('player-shadow '+name)[0];
    const cell = document.getElementById('cell-' + playerPos[name]);
    if (!cell) return;
    const { x, y } = getCellCenter(playerPos[name]);
    if (instant || playerPos[name] === 1) {
        floatingPlayer.style.transition = 'none';
        floatingPlayer.style.left = `${x}px`;
        floatingPlayer.style.top = `${y}px`;
        floatingPlayer.style.transform = `translate(-50%,-50%) rotate(0deg)`;
        try {
            playerShadow.style.transition = 'none';
            playerShadow.style.left = `${x}px`;
            playerShadow.style.top = `${y}px`;
            playerShadow.style.transform = `translate(-50%,-50%) scale(1)`;
            playerShadow.style.opacity = '0.95';
            void playerShadow.offsetWidth;
            playerShadow.style.transition = '';
        } catch (e) {}
        void floatingPlayer.offsetWidth;
        floatingPlayer.style.transition = '';
    } else {
        sleep(1200).then(() => {
            floatingPlayer.style.left = `${x}px`;
            floatingPlayer.style.top = `${y}px`;
            floatingPlayer.style.transform = `translate(-50%,-50%) rotate(0deg)`; });
        sleep(800).then(() => {
            try {
                playerShadow.style.left = `${x}px`;
                playerShadow.style.top = `${y}px`;
                playerShadow.style.transform = `translate(-50%,-50%) scale(1)`;
                playerShadow.style.opacity = '0.95';
            } catch (e) {}
        });
    }
   
    if (_lastTransformedCell && _lastTransformedCell !== cell) {
        _lastTransformedCell.classList.remove('cell-scaled');
        _lastTransformedCell.style.zIndex = '';
    }
    const cellPos = getCellCenter(playerPos[name]);
    if (cellPos) spawnRipple(cellPos.x, cellPos.y);
    cell.style.zIndex = 2;
    cell.classList.add('cell-scaled');
    const _onLeafAnimEnd = () => { try { cell.classList.remove('cell-scaled'); } catch (e) {} try { cell.style.zIndex = ''; } catch (e) {} cell.removeEventListener('animationend', _onLeafAnimEnd); };
    cell.addEventListener('animationend', _onLeafAnimEnd);
    _lastTransformedCell = cell;
}





function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function movePlayer(steps,name=2) {
    const floatingPlayer = document.getElementsByClassName('player '+name)[0];  
    const playerShadow = document.getElementsByClassName('player-shadow '+name)[0];
    const playerImg = floatingPlayer.querySelector('img.player-sprite');
    console.log(playerPos[name])
    if (steps <= 0) return;
    if (playerPos[name] + steps > 100) return;
    rollBtn.disabled = true;
    document.getElementById('diceWrapper').style.filter = 'grayscale(1)';
    status.textContent = '';

    for (let s = 0; s < steps; s++) {
        const nextIndex = playerPos[name] + 1;
        const nextCenter = getCellCenter(nextIndex);
        if (!nextCenter) break;
        try { if (playerImg) playerImg.src = '../images/frog1.gif'; } catch (e) {}
        await sleep(400)
        const prevTransition = floatingPlayer.style.transition || '';
        floatingPlayer.style.transition = `transform ${JUMP.upMs}ms cubic-bezier(.22,1,.36,1), left ${JUMP.flightMs}ms cubic-bezier(.22,1,.36,1), top ${JUMP.flightMs}ms cubic-bezier(.22,1,.36,1)`;
        floatingPlayer.style.transform = `translate(-50%,-50%) translateY(-${JUMP.heightPct * 100}%) scale(${JUMP.scaleUp})`;
        try {
            playerShadow.style.transition = `transform ${JUMP.upMs}ms cubic-bezier(.22,1,.36,1), left ${JUMP.flightMs}ms cubic-bezier(.22,1,.36,1), top ${JUMP.flightMs}ms cubic-bezier(.22,1,.36,1), opacity ${JUMP.upMs}ms ease`;
            playerShadow.style.transform = `translate(-50%,-50%) scale(0.6)`;
            playerShadow.style.opacity = '0.45';
        } catch (e) {}
        await sleep(JUMP.upMs);
        playerPos[name] = nextIndex;
        floatingPlayer.style.left = `${nextCenter.x}px`;
        floatingPlayer.style.top = `${nextCenter.y}px`;
        try { playerShadow.style.left = `${nextCenter.x}px`; playerShadow.style.top = `${nextCenter.y}px`; } catch (e) {}
        await sleep(JUMP.flightMs);
        floatingPlayer.style.transform = `translate(-50%,-50%) translateY(0) scale(1)`;
        try { playerShadow.style.transform = `translate(-50%,-50%) scale(1)`; playerShadow.style.opacity = '0.95'; } catch (e) {}
        if (nextCenter) spawnRipple(nextCenter.x, nextCenter.y);
        const landedCell = document.getElementById('cell-' + playerPos[name]);
        if (landedCell) {
            if (_lastTransformedCell && _lastTransformedCell !== landedCell) {
                _lastTransformedCell.classList.remove('cell-scaled');
                _lastTransformedCell.style.zIndex = '';
            }
            landedCell.style.zIndex = 2;
            landedCell.classList.add('cell-scaled');
            _lastTransformedCell = landedCell;
        }
        await sleep(320);
        try { if (playerImg) playerImg.src = '../images/frog.gif'; } catch (e) {}
        await sleep(80);
        floatingPlayer.style.transition = prevTransition;
    }

    if (snakes[playerPos[name]]) {
        const dest = snakes[playerPos[name]];
        status.textContent = `Oops! Bitten by a snake! Down to ${dest}`;
        await animateTransfer(dest,name);
        playerPos[name] = dest;
    } else if (ladders[playerPos[name]]) {
        const dest = ladders[playerPos[name]];
        status.textContent = `Yay! Climbed a ladder! Up to ${dest}`;
        await animateTransfer(dest,name);
        playerPos[name] = dest;
    }

    if (playerPos[name] === 100) {
        status.textContent = 'Congratulations! You won!';
        rollBtn.disabled = true;
    } else {
        rollBtn.disabled = false;
        document.getElementById('diceWrapper').style.filter = 'grayscale(0)';
    }
}

async function animateTransfer(targetIndex,name=2) {
    const floatingPlayer = document.getElementsByClassName('player '+name)[0];  
    const playerShadow = document.getElementsByClassName('player-shadow '+name)[0];
    const playerImg = floatingPlayer.querySelector('img.player-sprite');
    const destCenter = getCellCenter(targetIndex);
    if (!destCenter) return;
    try { if (playerImg) playerImg.src = '../images/frog1.gif'; } catch (e) {}
    const prevTransition = floatingPlayer.style.transition || '';
    floatingPlayer.style.transition = `transform ${JUMP.upMs}ms cubic-bezier(.22,1,.36,1), left ${JUMP.flightMs}ms cubic-bezier(.22,1,.36,1), top ${JUMP.flightMs}ms cubic-bezier(.22,1,.36,1)`;
    floatingPlayer.style.transform = `translate(-50%,-50%) translateY(-${JUMP.heightPct * 100}%) scale(${JUMP.scaleUp})`;
    try { playerShadow.style.transition = `transform ${JUMP.upMs}ms cubic-bezier(.22,1,.36,1), opacity ${JUMP.upMs}ms ease`; playerShadow.style.transform = `translate(-50%,-50%) scale(0.6)`; playerShadow.style.opacity = '0.45'; } catch (e) {}
    await sleep(JUMP.upMs + 30);
    floatingPlayer.style.left = `${destCenter.x}px`;
    floatingPlayer.style.top = `${destCenter.y}px`;
    try { playerShadow.style.left = `${destCenter.x}px`; playerShadow.style.top = `${destCenter.y}px`; } catch (e) {}
    await sleep(JUMP.flightMs + 20);
    floatingPlayer.style.transform = `translate(-50%,-50%) translateY(0) scale(1)`;
    try { playerShadow.style.transform = `translate(-50%,-50%) scale(1)`; playerShadow.style.opacity = '0.95'; } catch (e) {}
    await sleep(JUMP.landMs + 30);
    spawnRipple(destCenter.x, destCenter.y);
    const destCell = document.getElementById('cell-' + targetIndex);
    if (destCell) {
        if (_lastTransformedCell && _lastTransformedCell !== destCell) {
            _lastTransformedCell.classList.remove('cell-scaled');
            _lastTransformedCell.style.zIndex = '';
        }
        destCell.style.zIndex = 2;
        destCell.classList.add('cell-scaled');
        _lastTransformedCell = destCell;
    }
    try { if (playerImg) playerImg.src = '../images/frog.gif'; } catch (e) {}
    floatingPlayer.style.transition = prevTransition;
}

rollBtn.onclick = async () => {
    if (rollBtn.disabled) return;
    const roll = Math.floor(Math.random() * 6) + 1;

    rollBtn.disabled = true;
    await animateDice(roll);
        diceResult.textContent = `You rolled: ${roll}`;

    await movePlayer(roll,turn);
    nextplayer();
};

(function initCubeFaces(){
    const cube = document.getElementById('diceCube');
    if (!cube) return;
    const faces = cube.querySelectorAll('.face');
    const mapping = { front:1, right:2, back:6, left:5, top:3, bottom:4 };
    faces.forEach(f => {
                const cls = Array.from(f.classList).find(c => c !== 'face');
                const num = mapping[cls] || 1;
                // dice images live at ../images/DICE relative to this file (app/game)
                f.style.backgroundImage = `url('../images/DICE/dice${num}.png')`;
            });
    cube.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        const btn = document.getElementById('rollBtn');
        if (btn && !btn.disabled) btn.click();
    });
})();

function animateDice(finalFace) {
    return new Promise((resolve) => {
        const cube = document.getElementById('diceCube');
        if (!cube) return resolve();
        const rotateMap = {
            1: { x: 0,   y: 0   },
            2: { x: 0,   y: -90 },
            3: { x: -90,  y: 0   },
            4: { x: 90, y: 0   },
            5: { x: 0,   y: 90  },
            6: { x: 0,   y: 180 }
        };
        cube.style.transition = 'transform 400ms cubic-bezier(.2,.8,.2,1)';
        cube.style.transform = 'rotateX(720deg) rotateY(720deg)';
        const finalRot = rotateMap[finalFace] || rotateMap[1];
        setTimeout(() => {
            cube.style.transition = 'transform 500ms cubic-bezier(.2,.8,.2,1)';
            cube.style.transform = `rotateX(${finalRot.x}deg) rotateY(${finalRot.y}deg)`;
            setTimeout(() => { resolve(); }, 340);
        }, 720);
    });
}

(function initDice(){
            const cube = document.getElementById('diceCube');
            if (cube) cube.style.backgroundImage = `url('../images/DICE/dice1.png')`;
        })();
getPlayers();

