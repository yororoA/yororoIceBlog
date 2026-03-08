import React, { useEffect, useRef } from 'react';

const DOT_COUNT = 200;
const LEADER_RESELECT_MS = 3200;
const MAX_SPEED = 1.95;
const CLUSTER_DIST = 72;
const NEIGHBOR_DIST = 90;
const ENEMY_DIST = 180;
const RIPPLE_MAX_RADIUS = 320;
const EDGE_WRAP_PADDING = 10;
const MAX_CLUSTER_SIZE = 20;

const COLOR_MAP = {
	yellow: 'rgba(244, 200, 48, 0.92)',
	cyan: 'rgba(84, 214, 226, 0.92)',
	gray: 'rgba(152, 159, 170, 0.88)',
};

function rand(min, max) {
	return Math.random() * (max - min) + min;
}

function normalize(vx, vy) {
	const l = Math.hypot(vx, vy) || 1;
	return { x: vx / l, y: vy / l };
}

function getWrappedDelta(a, b, span) {
	let d = a - b;
	if (d > span / 2) d -= span;
	if (d < -span / 2) d += span;
	return d;
}

function isEnemy(src, target) {
	if (src.color === 'cyan' && src.role === 'attack') {
		return target.color === 'yellow' || target.color === 'gray';
	}
	if (src.color === 'yellow' && src.role === 'attack') {
		return target.color === 'gray';
	}
	return false;
}

function canLead(src, target) {
	if (src.color === target.color) return true;
	if (src.color === 'cyan' && src.role === 'protect') {
		return target.color === 'yellow' || target.color === 'gray';
	}
	if (src.color === 'yellow' && src.role === 'protect') {
		return target.color === 'gray';
	}
	return false;
}

const BirdsBackground = ({ className = '' }) => {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d', { alpha: true });
		if (!ctx) return;

		let width = window.innerWidth;
		let height = window.innerHeight;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		const colors = Array.from({ length: DOT_COUNT }, (_, i) => {
			if (i < 34) return 'yellow';
			if (i < 67) return 'cyan';
			return 'gray';
		}).sort(() => Math.random() - 0.5);

		const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
			const n = normalize(rand(-1, 1), rand(-1, 1));
			const color = colors[i];
			const role = color === 'gray' ? 'neutral' : (Math.random() < 0.5 ? 'protect' : 'attack');
			return {
				x: rand(0, width),
				y: rand(0, height),
				vx: n.x * rand(0.35, 1.1),
				vy: n.y * rand(0.35, 1.1),
				color,
				role,
				clusterId: -1,
				leaderForCluster: false,
			};
		});

		const ripples = [];
		const clusterLeaders = new Map();
		const clusterAttackers = new Map();
		const clusterSizes = new Map();
		const clusterCenters = new Map();
		const clusterColors = new Map();
		let leaderTimer = 0;
		let rafId = 0;
		let lastTs = performance.now();

		const resize = () => {
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};

		const calcClusters = () => {
			clusterSizes.clear();
			clusterCenters.clear();
			clusterColors.clear();
			clusterLeaders.clear();
			clusterAttackers.clear();
			for (let i = 0; i < dots.length; i++) {
				dots[i].clusterId = -1;
				dots[i].leaderForCluster = false;
				dots[i].attackerForCluster = false;
			}

			const splitMembers = (members) => {
				if (members.length <= MAX_CLUSTER_SIZE) return [members];
				const pending = [...members];
				const groups = [];
				while (pending.length > 0) {
					const seed = pending.shift();
					const seedDot = dots[seed];
					const chunk = [seed];
					const takeCount = Math.min(MAX_CLUSTER_SIZE - 1, pending.length);
					for (let t = 0; t < takeCount; t++) {
						let nearestIdx = 0;
						let nearestDist = Infinity;
						for (let p = 0; p < pending.length; p++) {
							const cand = dots[pending[p]];
							const dx = getWrappedDelta(cand.x, seedDot.x, width);
							const dy = getWrappedDelta(cand.y, seedDot.y, height);
							const d2 = dx * dx + dy * dy;
							if (d2 < nearestDist) {
								nearestDist = d2;
								nearestIdx = p;
							}
						}
						chunk.push(pending.splice(nearestIdx, 1)[0]);
					}
					groups.push(chunk);
				}
				return groups;
			};

			let cid = 0;
			for (let i = 0; i < dots.length; i++) {
				if (dots[i].clusterId !== -1) continue;
				const color = dots[i].color;
				const q = [i];
				const membersRaw = [];
				dots[i].clusterId = cid;
				while (q.length) {
					const idx = q.pop();
					membersRaw.push(idx);
					for (let j = 0; j < dots.length; j++) {
						if (dots[j].clusterId !== -1 || dots[j].color !== color) continue;
						const dx = getWrappedDelta(dots[j].x, dots[idx].x, width);
						const dy = getWrappedDelta(dots[j].y, dots[idx].y, height);
						if (dx * dx + dy * dy <= CLUSTER_DIST * CLUSTER_DIST) {
							dots[j].clusterId = cid;
							q.push(j);
						}
					}
				}

				const chunks = splitMembers(membersRaw);
				for (let c = 0; c < chunks.length; c++) {
					const members = chunks[c];
					for (let m = 0; m < members.length; m++) {
						dots[members[m]].clusterId = cid;
					}
					clusterSizes.set(cid, members.length);
					clusterColors.set(cid, color);

					let centerX = 0;
					let centerY = 0;
					for (let m = 0; m < members.length; m++) {
						centerX += dots[members[m]].x;
						centerY += dots[members[m]].y;
					}
					clusterCenters.set(cid, {
						x: centerX / Math.max(1, members.length),
						y: centerY / Math.max(1, members.length),
					});

					if (members.length >= 3) {
						const leaderIdx = members[Math.floor(Math.random() * members.length)];
						clusterLeaders.set(cid, leaderIdx);
						dots[leaderIdx].leaderForCluster = true;
					}

					const attackerCandidates = members.filter((idx) => dots[idx].role === 'attack');
					if (attackerCandidates.length > 0) {
						const attackerIdx = attackerCandidates[Math.floor(Math.random() * attackerCandidates.length)];
						clusterAttackers.set(cid, attackerIdx);
						dots[attackerIdx].attackerForCluster = true;
					}
					cid++;
				}
			}
		};

		const onPointerDown = (e) => {
			ripples.push({ x: e.clientX, y: e.clientY, radius: 0, maxRadius: RIPPLE_MAX_RADIUS, life: 1 });
		};

		const step = (dtMs) => {
			leaderTimer += dtMs;
			if (leaderTimer > LEADER_RESELECT_MS || clusterLeaders.size === 0) {
				leaderTimer = 0;
				calcClusters();
			}

			for (let i = ripples.length - 1; i >= 0; i--) {
				const r = ripples[i];
				r.radius += dtMs * 0.22;
				r.life -= dtMs * 0.0007;
				if (r.radius > r.maxRadius) r.life -= dtMs * 0.0011;
				if (r.life <= 0) ripples.splice(i, 1);
			}

			const dt = Math.min(2, dtMs / 16.67);
			for (let i = 0; i < dots.length; i++) {
				const b = dots[i];

				let ax = 0;
				let ay = 0;
				let sameColorCenterX = 0;
				let sameColorCenterY = 0;
				let sameColorCount = 0;

				for (let j = 0; j < dots.length; j++) {
					if (j === i) continue;
					const o = dots[j];
					const dx = getWrappedDelta(o.x, b.x, width);
					const dy = getWrappedDelta(o.y, b.y, height);
					const d2 = dx * dx + dy * dy;
					if (d2 === 0) continue;
					const dist = Math.sqrt(d2);

					if (dist < 22) {
						ax -= (dx / dist) * 0.25;
						ay -= (dy / dist) * 0.25;
					}

					if (o.color === b.color && o.clusterId === b.clusterId && dist < NEIGHBOR_DIST) {
						sameColorCenterX += dx;
						sameColorCenterY += dy;
						sameColorCount += 1;
						ax += (o.vx - b.vx) * 0.01;
						ay += (o.vy - b.vy) * 0.01;
					}

					// 同色异阵营基础排斥，确保切分后的阵营不会重新粘连成大团
					if (o.color === b.color && o.clusterId !== b.clusterId && dist < 150) {
						const f = (1 - dist / 150) * 0.2;
						ax -= (dx / dist) * f;
						ay -= (dy / dist) * f;
					}

					if (dist < ENEMY_DIST && isEnemy(o, b)) {
						const f = (1 - dist / ENEMY_DIST) * 0.42;
						ax -= (dx / dist) * f;
						ay -= (dy / dist) * f;
					}
				}

				if (sameColorCount > 0) {
					ax += (sameColorCenterX / sameColorCount) * 0.0019;
					ay += (sameColorCenterY / sameColorCount) * 0.0019;
				}

				const clusterSize = clusterSizes.get(b.clusterId) || 1;
				const clusterLeaderIdx = clusterLeaders.get(b.clusterId);
				const clusterAttackerIdx = clusterAttackers.get(b.clusterId);
				if (clusterLeaderIdx != null && clusterLeaderIdx !== i) {
					const ld = dots[clusterLeaderIdx];
					const lx = getWrappedDelta(ld.x, b.x, width);
					const ly = getWrappedDelta(ld.y, b.y, height);
					ax += lx * 0.003;
					ay += ly * 0.003;
				}

				// 每个阵营最多一个攻击：若当前阵营已有攻击，则排斥其他同阵营攻击点
				if (b.role === 'attack' && clusterAttackerIdx != null && clusterAttackerIdx !== i) {
					const c = clusterCenters.get(b.clusterId);
					if (c) {
						const dx = getWrappedDelta(c.x, b.x, width);
						const dy = getWrappedDelta(c.y, b.y, height);
						const dist = Math.hypot(dx, dy) || 1;
						const f = Math.min(0.45, 22 / dist);
						ax -= (dx / dist) * f;
						ay -= (dy / dist) * f;
					}
				}

				// 阵营没有攻击时，可纳入一个同色攻击（吸引最近同色攻击）
				if (clusterAttackerIdx == null && b.role !== 'attack') {
					let bestAtk = null;
					let bestAtkDist = Infinity;
					for (let j = 0; j < dots.length; j++) {
						if (j === i) continue;
						const o = dots[j];
						if (o.color !== b.color || o.role !== 'attack') continue;
						if (clusterAttackers.get(o.clusterId) != null) continue;
						const dx = getWrappedDelta(o.x, b.x, width);
						const dy = getWrappedDelta(o.y, b.y, height);
						const d = Math.hypot(dx, dy);
						if (d < 180 && d < bestAtkDist) {
							bestAtkDist = d;
							bestAtk = { dx, dy };
						}
					}
					if (bestAtk) {
						ax += bestAtk.dx * 0.0014;
						ay += bestAtk.dy * 0.0014;
					}
				}

				// 有攻击的阵营会排斥其他同色阵营
				if (clusterAttackerIdx != null) {
					for (const [otherCid, center] of clusterCenters.entries()) {
						if (otherCid === b.clusterId) continue;
						if (clusterColors.get(otherCid) !== b.color) continue;
						const dx = getWrappedDelta(center.x, b.x, width);
						const dy = getWrappedDelta(center.y, b.y, height);
						const dist = Math.hypot(dx, dy);
						if (dist > 1 && dist < 220) {
							const f = (1 - dist / 220) * 0.26;
							ax -= (dx / dist) * f;
							ay -= (dy / dist) * f;
						}
					}
				}

				let bestLeader = null;
				let bestLeaderDist = Infinity;
				for (let j = 0; j < dots.length; j++) {
					if (j === i) continue;
					const o = dots[j];
					if (o.color === b.color && o.clusterId !== b.clusterId) continue;
					if (!canLead(o, b)) continue;
					const dx = getWrappedDelta(o.x, b.x, width);
					const dy = getWrappedDelta(o.y, b.y, height);
					const d = Math.hypot(dx, dy);
					if (d < 160 && d < bestLeaderDist) {
						bestLeaderDist = d;
						bestLeader = { dx, dy };
					}
				}
				if (bestLeader && clusterLeaderIdx == null) {
					ax += bestLeader.dx * 0.0015;
					ay += bestLeader.dy * 0.0015;
				}

				const splitProb = clusterSize > 10 ? 0.032 : (clusterSize > 5 ? 0.02 : 0);
				if (splitProb > 0 && Math.random() < splitProb * dt) {
					const p = normalize(rand(-1, 1), rand(-1, 1));
					ax += p.x * 0.82;
					ay += p.y * 0.82;
				}

				for (let k = 0; k < ripples.length; k++) {
					const r = ripples[k];
					const dx = b.x - r.x;
					const dy = b.y - r.y;
					const dist = Math.hypot(dx, dy);
					const band = Math.abs(dist - r.radius);
					if (band < 46 && r.radius < r.maxRadius) {
						const n = normalize(dx, dy);
						const force = (1 - band / 46) * 0.95 * r.life;
						ax += n.x * force;
						ay += n.y * force;
					}
					if (dist < r.radius + 22) {
						const n = normalize(dx, dy);
						const force = (1 - dist / (r.radius + 22)) * 0.28 * r.life;
						ax += n.x * force;
						ay += n.y * force;
					}
				}

				ax += rand(-0.015, 0.015);
				ay += rand(-0.015, 0.015);

				b.vx += ax * dt;
				b.vy += ay * dt;

				const sp = Math.hypot(b.vx, b.vy);
				if (sp > MAX_SPEED) {
					b.vx = (b.vx / sp) * MAX_SPEED;
					b.vy = (b.vy / sp) * MAX_SPEED;
				}

				b.x += b.vx * dt * 1.3;
				b.y += b.vy * dt * 1.3;

				if (b.x < -EDGE_WRAP_PADDING) b.x = width + EDGE_WRAP_PADDING;
				if (b.x > width + EDGE_WRAP_PADDING) b.x = -EDGE_WRAP_PADDING;
				if (b.y < -EDGE_WRAP_PADDING) b.y = height + EDGE_WRAP_PADDING;
				if (b.y > height + EDGE_WRAP_PADDING) b.y = -EDGE_WRAP_PADDING;
			}
		};

		const render = () => {
			ctx.clearRect(0, 0, width, height);

			for (let i = 0; i < dots.length; i++) {
				const a = dots[i];
				for (let j = i + 1; j < dots.length; j++) {
					const b = dots[j];
					const dx = a.x - b.x;
					const dy = a.y - b.y;
					const dist = Math.hypot(dx, dy);
					if (dist < 64 && a.color === b.color && a.clusterId === b.clusterId) {
						const alpha = (1 - dist / 64) * 0.16;
						if (a.color === 'yellow') ctx.strokeStyle = `rgba(236, 195, 70, ${alpha})`;
						if (a.color === 'cyan') ctx.strokeStyle = `rgba(110, 225, 235, ${alpha})`;
						if (a.color === 'gray') ctx.strokeStyle = `rgba(165, 172, 184, ${alpha})`;
						ctx.lineWidth = 1;
						ctx.beginPath();
						ctx.moveTo(a.x, a.y);
						ctx.lineTo(b.x, b.y);
						ctx.stroke();
					}
				}
			}

			for (let i = 0; i < ripples.length; i++) {
				const r = ripples[i];
				ctx.strokeStyle = `rgba(115, 168, 255, ${0.26 * r.life})`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
				ctx.stroke();
			}

			for (let i = 0; i < dots.length; i++) {
				const b = dots[i];
				const baseColor = COLOR_MAP[b.color];
				ctx.fillStyle = b.leaderForCluster
					? baseColor.replace('0.92', '1').replace('0.88', '1')
					: baseColor;
				ctx.beginPath();
				ctx.arc(b.x, b.y, b.leaderForCluster ? 3.4 : 2.2, 0, Math.PI * 2);
				ctx.fill();

				if (b.role !== 'neutral') {
					ctx.fillStyle = b.role === 'protect' ? 'rgba(120, 232, 160, 0.7)' : (b.attackerForCluster ? 'rgba(255, 92, 92, 0.95)' : 'rgba(255, 114, 114, 0.45)');
					ctx.beginPath();
					ctx.arc(b.x + 2.8, b.y - 2.2, 0.9, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		};

		const loop = (ts) => {
			const dtMs = ts - lastTs;
			lastTs = ts;
			step(dtMs);
			render();
			rafId = requestAnimationFrame(loop);
		};

		resize();
		calcClusters();
		window.addEventListener('resize', resize);
		window.addEventListener('pointerdown', onPointerDown);
		rafId = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('resize', resize);
			window.removeEventListener('pointerdown', onPointerDown);
		};
	}, []);

	return <canvas ref={canvasRef} className={className} aria-hidden />;
};

export default BirdsBackground;
