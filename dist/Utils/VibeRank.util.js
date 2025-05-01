"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUserRank = void 0;
const calculateUserRank = (vibeScore) => {
    if (vibeScore >= 100000)
        return "Solobrity";
    if (vibeScore >= 50000)
        return "Healer";
    if (vibeScore >= 30000)
        return "Leader";
    if (vibeScore >= 10000)
        return "Homie";
    if (vibeScore >= 5000)
        return "Capped";
    if (vibeScore >= 2000)
        return "Hustler";
    return "Runner"; // Default base rank
};
exports.calculateUserRank = calculateUserRank;
//# sourceMappingURL=VibeRank.util.js.map