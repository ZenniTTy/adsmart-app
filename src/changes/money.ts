const MICROS_PER_UNIT = 1_000_000;

export function toMicros(amount: number): string {
	return String(Math.round(amount * 100) * (MICROS_PER_UNIT / 100));
}

export function formatMoney(micros: string | null, currency: string): string {
	if (micros === null) {
		return "sem valor";
	}
	return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
		Number(micros) / MICROS_PER_UNIT,
	);
}

export const HIGHLIGHT_INCREASE_RATIO = 1.5;

export function increaseAboveHalf(before: string | null, after: string): boolean {
	const current = before === null ? 0 : Number(before);
	if (current <= 0) {
		return true;
	}
	return Number(after) > current * HIGHLIGHT_INCREASE_RATIO;
}
