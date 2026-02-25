// ═══════════════════════════════════════════════════════════════════════════
// خوارزمية القص المحسّنة (1D Cutting Stock Problem) - الإصدار المصحح V5
// ═══════════════════════════════════════════════════════════════════════════

import type { CuttingRequest, CuttingResult, CuttingPattern } from './types';
import { REBAR_SPECIFICATIONS } from './saudi-rebar-specs';

/**
 * خوارزمية القص المحسّنة - الإصدار المصحح V5
 *
 * الإصلاحات:
 * 1. معالجة صحيحة للقطع الأطول من السيخ مع وصلات (lap splices)
 * 2. تجميع القطع المتشابهة قبل الحساب
 * 3. حساب دقيق لعدد الأسياخ المطلوبة
 * 4. حساب صحيح للهدر مع وصلات (lap overlap فقط، وليس كامل السيخ)
 */
export function optimizedCutting(request: CuttingRequest): CuttingResult {
    const startTime = performance.now();

    // القيم الافتراضية
    const bladeWidth = request.bladeWidth ?? REBAR_SPECIFICATIONS.bladeWidth;
    const stockLength = request.stockLengths?.[0] || 12;
    const diameter = request.diameter;
    const lapLength = REBAR_SPECIFICATIONS.lapLength(diameter);

    // ══════════════════════════════════════════════════════════════════
    // الخطوة 1: تجميع القطع حسب الطول (تقريب لأقرب مليمتر)
    // ══════════════════════════════════════════════════════════════════
    const pieceGroups = new Map<number, {
        id: string;
        length: number;
        totalCount: number
    }>();

    let inputTotalCount = 0;
    let inputTotalLength = 0;

    for (const piece of request.pieces) {
        inputTotalCount += piece.quantity;
        inputTotalLength += piece.length * piece.quantity;

        // تقريب لأقرب مليمتر لدمج القطع المتشابهة
        const key = Math.round(piece.length * 1000);
        const existing = pieceGroups.get(key);

        if (existing) {
            existing.totalCount += piece.quantity;
        } else {
            pieceGroups.set(key, {
                id: piece.id,
                length: piece.length,
                totalCount: piece.quantity
            });
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // الخطوة 2: ترتيب المجموعات تنازلياً حسب الطول
    // ══════════════════════════════════════════════════════════════════
    const sortedGroups = Array.from(pieceGroups.values())
        .sort((a, b) => b.length - a.length);

    // ══════════════════════════════════════════════════════════════════
    // الخطوة 3: حساب الأنماط لكل مجموعة
    // ══════════════════════════════════════════════════════════════════
    const patterns: CuttingPattern[] = [];
    let totalNetLength = 0;
    let totalGrossLength = 0;
    let totalBars = 0;
    let totalLapSpliceLength = 0;
    let totalLapSpliceJoints = 0;
    let hasLongSpans = false;

    for (const group of sortedGroups) {
        const groupNetLength = group.length * group.totalCount;

        // ════════════════════════════════════════════════════════════
        // الحالة 1: القطعة أطول من السيخ (تحتاج وصل)
        // ════════════════════════════════════════════════════════════
        if (group.length > stockLength) {
            // حساب عدد الأسياخ المطلوبة مع مراعاة الوصلات
            let barsPerPiece: number;
            if (stockLength > lapLength) {
                barsPerPiece = Math.ceil((group.length - lapLength) / (stockLength - lapLength));
                if (barsPerPiece < 1) barsPerPiece = 1;
            } else {
                barsPerPiece = Math.ceil(group.length / stockLength);
            }

            // التحقق من أن الحساب صحيح
            let actualLapJointsPerPiece = barsPerPiece - 1;
            let availableLengthWithLaps = barsPerPiece * stockLength - actualLapJointsPerPiece * lapLength;
            if (availableLengthWithLaps < group.length) {
                barsPerPiece += 1;
                actualLapJointsPerPiece = barsPerPiece - 1;
            }

            const totalBarsForGroup = barsPerPiece * group.totalCount;
            const groupGrossLength = totalBarsForGroup * stockLength;

            const effectiveLengthWithLaps = group.length + (actualLapJointsPerPiece * lapLength);
            const wastePerPiece = (barsPerPiece * stockLength) - effectiveLengthWithLaps;

            patterns.push({
                stockLength,
                barCount: totalBarsForGroup,
                cuts: [{
                    pieceId: group.id,
                    length: group.length,
                    quantity: group.totalCount
                }],
                remnant: wastePerPiece,
                efficiency: (group.length / (barsPerPiece * stockLength)) * 100
            });

            totalNetLength += groupNetLength;
            totalGrossLength += groupGrossLength;
            totalBars += totalBarsForGroup;

            if (actualLapJointsPerPiece > 0) {
                totalLapSpliceLength += actualLapJointsPerPiece * lapLength * group.totalCount;
                totalLapSpliceJoints += actualLapJointsPerPiece * group.totalCount;
                hasLongSpans = true;
            }
        }
        // ════════════════════════════════════════════════════════════
        // الحالة 2: القطعة أقصر من أو تساوي السيخ
        // ════════════════════════════════════════════════════════════
        else {
            const effectiveLength = group.length + bladeWidth;
            const piecesPerBar = Math.floor(stockLength / effectiveLength);

            if (piecesPerBar <= 0) {
                const barsPerPiece = Math.ceil(group.length / stockLength);
                const totalBarsForGroup = barsPerPiece * group.totalCount;
                const groupGrossLength = totalBarsForGroup * stockLength;

                patterns.push({
                    stockLength,
                    barCount: totalBarsForGroup,
                    cuts: [{ pieceId: group.id, length: group.length, quantity: group.totalCount }],
                    remnant: 0,
                    efficiency: (groupNetLength / groupGrossLength) * 100
                });

                totalNetLength += groupNetLength;
                totalGrossLength += groupGrossLength;
                totalBars += totalBarsForGroup;
                continue;
            }

            const barsNeeded = Math.ceil(group.totalCount / piecesPerBar);
            const groupGrossLength = barsNeeded * stockLength;
            const usedLengthPerBar = piecesPerBar * group.length;
            const remnantPerBar = stockLength - usedLengthPerBar;

            patterns.push({
                stockLength,
                barCount: barsNeeded,
                cuts: [{
                    pieceId: group.id,
                    length: group.length,
                    quantity: piecesPerBar
                }],
                remnant: remnantPerBar,
                efficiency: (usedLengthPerBar / stockLength) * 100
            });

            totalNetLength += groupNetLength;
            totalGrossLength += groupGrossLength;
            totalBars += barsNeeded;
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // الخطوة 4: حساب النتائج النهائية
    // ══════════════════════════════════════════════════════════════════

    const totalUsedLength = totalNetLength + totalLapSpliceLength;
    const wasteLength = Math.max(0, totalGrossLength - totalUsedLength);
    const actualWasteLength = wasteLength;

    const wastePercentage = totalGrossLength > 0
        ? ((totalGrossLength - totalNetLength) / totalGrossLength) * 100
        : 0;

    const utilizationRate = totalGrossLength > 0
        ? (totalNetLength / totalGrossLength) * 100
        : 0;

    const executionTime = performance.now() - startTime;

    return {
        patterns,
        totalBars,
        totalNetLength: Number(totalNetLength.toFixed(2)),
        totalGrossLength: Number(totalGrossLength.toFixed(2)),
        wasteLength: Number(wasteLength.toFixed(2)),
        wastePercentage: Number(wastePercentage.toFixed(1)),
        reusableRemnants: [],
        utilizationRate: Number(utilizationRate.toFixed(1)),
        algorithm: 'Simple-FFD-v5-with-lap-splices',
        executionTime: Number(executionTime.toFixed(2)),
        lapSpliceLength: Number(totalLapSpliceLength.toFixed(2)),
        lapSpliceJoints: totalLapSpliceJoints,
        actualWasteLength: Number(actualWasteLength.toFixed(2)),
        hasLongSpans
    };
}

/**
 * اقتراح استخدامات للفضلة
 */
export function suggestRemnantUses(length: number): string[] {
    const uses: string[] = [];

    if (length >= 0.3 && length < 0.5) {
        uses.push('كراسي تثبيت الحديد', 'فواصل');
    }
    if (length >= 0.5 && length < 1.0) {
        uses.push('أسياخ ربط', 'تقوية زوايا', 'كانات صغيرة');
    }
    if (length >= 1.0 && length < 2.0) {
        uses.push('حديد إضافي للفتحات', 'تقوية حول الأعمدة');
    }
    if (length >= 2.0) {
        uses.push('حديد سفلي للبلاطات', 'حديد كمرات قصيرة');
    }

    return uses;
}
