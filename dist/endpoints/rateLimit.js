import { LMSError } from '../services/shared.js';
const hits = new Map();
let lastSweep = 0;
/** Number of users currently tracked. Exposed for tests. */ export const trackedRateLimitKeys = ()=>hits.size;
/**
 * Forgets users with no calls inside the window, so the map does not grow with every user the
 * process has ever seen. Runs at most once per window.
 */ const sweep = (now, windowMs)=>{
    if (now - lastSweep < windowMs) {
        return;
    }
    lastSweep = now;
    for (const [key, times] of hits){
        if (times.every((time)=>now - time >= windowMs)) {
            hits.delete(key);
        }
    }
};
/**
 * Records one call and returns whether it is still inside the limit. A non-positive `max` means
 * no limit. Timestamps outside the window are dropped.
 */ export const takeRateLimitSlot = ({ key, max, now, windowMs })=>{
    if (max <= 0) {
        return true;
    }
    sweep(now, windowMs);
    const recent = (hits.get(key) ?? []).filter((time)=>now - time < windowMs);
    if (recent.length >= max) {
        hits.set(key, recent);
        return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
};
/**
 * Shared limit for every LMS endpoint, counted per logged-in user.
 */ export const assertRateLimit = (req, userId)=>{
    const lms = req.payload.config.custom?.lms;
    const max = typeof lms?.rateLimitMax === 'number' ? lms.rateLimitMax : 60;
    const windowSeconds = typeof lms?.rateLimitWindowSeconds === 'number' ? lms.rateLimitWindowSeconds : 60;
    const allowed = takeRateLimitSlot({
        key: String(userId),
        max,
        now: Date.now(),
        windowMs: windowSeconds * 1000
    });
    if (!allowed) {
        throw new LMSError('Too many requests. Please wait and try again.', 429);
    }
};

//# sourceMappingURL=rateLimit.js.map