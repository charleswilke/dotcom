/* Render-only poses and contact timing. Shot paths and collision radii stay in physics.js. */
(function (root) {
  'use strict';
  const SINK_DURATION = .72;
  const CONTACT_TIME = .065;
  const STRIKE_DURATION = .12;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  function create(time = -Infinity, angle = 0, power = 0, reduced = false, launchSpeed = Infinity) {
    return { strikeTime: time, launchTime: time + (reduced ? 0 : STRIKE_DURATION), power,
      direction: { x: Math.cos(angle), y: Math.sin(angle) },
      releaseRise: Math.max(.06 + .12 * (1 - power), 16 * (.86 + .47 * power) / launchSpeed),
      stretch: 0, hit: null, captureTime: -Infinity, settleTime: -Infinity, sinkTime: -Infinity };
  }
  function update(motion, body, force, elapsed, reduced = false) {
    const speed = Math.hypot(body.vx || 0, body.vy || 0);
    let target = 0;
    if (body.status === 'moving' && speed > 0) {
      motion.direction = { x: body.vx / speed, y: body.vy / speed };
      const acceleration = Math.max(0, force.x * motion.direction.x + force.y * motion.direction.y);
      target = .12 * Math.min(1, speed / 576) + .04 * Math.min(1, acceleration / 220);
    }
    motion.stretch = reduced ? 0 : motion.stretch + (target - motion.stretch) * (1 - Math.exp(-elapsed / .06));
  }
  function hit(motion, time, contact) {
    motion.hit = { ...contact, time, strength: clamp(contact.speed / 420, 0, 1) };
  }
  function projectedAngle(direction, matrix) {
    const [a, b, c, d] = matrix;
    return Math.atan2(b * direction.x + d * direction.y, a * direction.x + c * direction.y);
  }
  function sample(motion, time, matrix, reduced = false) {
    const sinkDuration = reduced ? .045 : SINK_DURATION;
    const sink = clamp((time - motion.sinkTime) / sinkDuration, 0, 1);
    // An unset sink time is -Infinity; only an actual sink may shrink the ball.
    const sinking = Number.isFinite(motion.sinkTime);
    let stretch = reduced ? 0 : motion.stretch, direction = motion.direction, size = 1;
    if (!reduced) {
      const launchAge = time - motion.launchTime, strikeAge = time - motion.strikeTime;
      const compression = .36 + motion.power * .12, burst = .5 + motion.power * .35;
      if (strikeAge >= 0 && launchAge < 0) {
        // The ball stays round until the club face arrives; then it loads at contact.
        stretch = -compression * Math.sin(Math.PI / 2 * clamp((strikeAge - CONTACT_TIME) / (STRIKE_DURATION - CONTACT_TIME), 0, 1));
      } else if (launchAge >= 0) {
        // Softer putts unfold more slowly, so stretching cannot outrun the ball.
        const rise = motion.releaseRise, holdEnd = rise + .08;
        // Give the small ball a readable elongated silhouette before recovering.
        if (launchAge < holdEnd + .41) stretch += launchAge < rise ? -compression + (compression + burst) * (1 - (1 - launchAge / rise) ** 2) :
          launchAge < holdEnd ? burst : burst * (1 - (launchAge - holdEnd) / .41) ** 2;
      }
      const hitAge = motion.hit ? time - motion.hit.time : Infinity;
      if (hitAge >= 0 && hitAge < .18) {
        direction = { x: motion.hit.nx, y: motion.hit.ny };
        const compression = .04 + .16 * motion.hit.strength;
        stretch = hitAge < .045 ? -compression * (1 - hitAge / .045) :
          compression * .45 * Math.sin(Math.PI * (hitAge - .045) / .135);
      }
      const captureAge = time - motion.captureTime, settleAge = time - motion.settleTime;
      if (captureAge >= 0 && captureAge < .18) size -= .09 * Math.sin(Math.PI * captureAge / .18);
      if (settleAge >= 0 && settleAge < .14) size += .04 * Math.sin(Math.PI * 2 * settleAge / .14) * (1 - settleAge / .14);
    }
    const scaleX = 1 + clamp(stretch, -.48, .95);
    const drop = sinking && !reduced ? clamp((sink - .4) / .42, 0, 1) ** 2 : 0;
    if (sinking && !reduced) {
      // A small rim pause gives way to an accelerating drop, then a beat for
      // the cup ripple before the result panel arrives.
      size *= sink < .18 ? 1 + .12 * Math.sin(Math.PI * sink / .18) : 1 - drop;
    }
    return { angle: projectedAngle(direction, matrix), scaleX, scaleY: 1 / scaleX,
      size, opacity: sinking ? reduced ? 1 - sink : 1 - clamp((sink - .45) / .37, 0, 1) : 1, drop };
  }
  function cupRattle(progress, radius, reduced = false) {
    if (reduced || progress <= .08 || progress >= .4) return { x: 0, y: 0 };
    const t = (progress - .08) / .32;
    const envelope = radius * (1 - t) ** 1.4;
    return { x: Math.sin(t * Math.PI * 5) * envelope,
      y: Math.sin(t * Math.PI * 4) * envelope * .45 };
  }
  function putter(motion, time, initialSetback, radius) {
    if (!Number.isFinite(motion.strikeTime) || motion.launchTime === motion.strikeTime) return null;
    const age = time - motion.strikeTime, launchAge = time - motion.launchTime;
    if (age < 0 || launchAge >= .18) return null;
    // The head's leading edge sits 3.5 world units ahead of its setback origin.
    const faceOffset = 3.5, contact = radius + faceOffset;
    if (age < CONTACT_TIME) {
      const travel = (age / CONTACT_TIME) ** 2;
      return { setback: initialSetback + (contact - initialSetback) * travel, opacity: 1, tether: 1 - travel };
    }
    if (launchAge < 0) {
      return { setback: radius * sample(motion, time, [1, 0, 0, 1]).scaleX + faceOffset, opacity: 1, tether: 0 };
    }
    const compressedContact = radius * (1 - (.36 + motion.power * .12)) + faceOffset;
    const progress = launchAge / .18;
    return { setback: compressedContact - (compressedContact + 8) * (1 - (1 - progress) ** 3),
      opacity: 1 - progress * progress, tether: 0 };
  }
  const api = { SINK_DURATION, CONTACT_TIME, STRIKE_DURATION, create, update, hit, sample, putter, cupRattle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CosmicMotion = api;
})(typeof window !== 'undefined' ? window : globalThis);
