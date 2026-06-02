function pickNiceStep(roughStep: number): number {
    if (roughStep <= 0) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    const niceUnit =
        normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return niceUnit * magnitude;
}

/**
 * Y-axis max slightly above the data peak, with clean integer ticks.
 * Does not force a tall axis when the series only needs a few steps.
 */
export function buildNiceYAxisScale(dataMax: number, targetTickCount = 5) {
    if (dataMax <= 0) {
        return { max: 100, step: 20, tickAmount: 5 };
    }

    const paddedMax = dataMax * 1.12;
    let roughStep = paddedMax / targetTickCount;
    let step = pickNiceStep(roughStep);
    let tickAmount = Math.max(3, Math.ceil(paddedMax / step));
    let max = step * tickAmount;

    // If the scale is still much taller than the data, use a finer step.
    while (max > dataMax * 1.35 && step > 1) {
        const finer = pickNiceStep(step / 2);
        if (finer >= step) break;
        step = finer;
        tickAmount = Math.max(3, Math.ceil(paddedMax / step));
        max = step * tickAmount;
    }

    return { max, step, tickAmount };
}
