/**
 * Hemisphere resolution.
 *
 * Seasons are inverted between hemispheres, so every seasonal decision needs to know which
 * hemisphere the user is in. Getting this wrong is not cosmetic: it tells a Sydney user to
 * increase summer watering during their winter.
 *
 * Resolution is an explicit fallback chain rather than a default parameter, because the
 * previous `latitude: number = 40` signature meant every caller that omitted the argument
 * silently asserted "northern hemisphere" with no way to detect it had happened.
 */

export type Hemisphere = 'northern' | 'southern';

/** Where a hemisphere determination came from, in descending order of reliability. */
export type HemisphereSource = 'latitude' | 'timezone' | 'assumed';

export interface HemisphereResolution {
    hemisphere: Hemisphere;
    source: HemisphereSource;
    /**
     * True when the hemisphere could not be determined and northern was assumed.
     * Callers should hedge user-facing copy when this is set.
     */
    isAssumed: boolean;
}

export interface HemisphereInput {
    /** Latitude from granted location access. Most reliable signal. */
    latitude?: number | null;
    /** IANA timezone, e.g. from `profiles.push_notification_timezone`. */
    timeZone?: string | null;
}

/**
 * IANA timezone prefixes that are entirely in the southern hemisphere.
 */
const SOUTHERN_ZONE_PREFIXES = [
    'Australia/',
    'Antarctica/',
    'America/Argentina/',
] as const;

/**
 * Individual IANA zones in the southern hemisphere.
 *
 * This list is deliberately explicit rather than computed: mapping a timezone to a latitude
 * requires a full tz database, which is not worth bundling for a single bit of information.
 * It covers the populated southern hemisphere. Zones not listed here fall through to the
 * next step in the chain, so a miss degrades to "assumed northern" rather than to an error.
 *
 * Zones near the equator (Nairobi, Bogotá, Quito, Singapore) are intentionally omitted —
 * seasonal adjustment is not meaningful within a few degrees of the equator, so the
 * northern-hemisphere calendar is a harmless choice there.
 */
const SOUTHERN_ZONES = new Set<string>([
    // Oceania
    'Pacific/Auckland',
    'Pacific/Chatham',
    'Pacific/Fiji',
    'Pacific/Norfolk',
    'Pacific/Noumea',
    'Pacific/Guadalcanal',
    'Pacific/Efate',
    'Pacific/Tongatapu',
    'Pacific/Apia',
    'Pacific/Pago_Pago',
    'Pacific/Tahiti',
    'Pacific/Rarotonga',
    'Pacific/Easter',
    'Pacific/Bougainville',
    'Pacific/Port_Moresby',
    'Pacific/Niue',
    'Pacific/Tarawa',
    // South America
    'America/Sao_Paulo',
    'America/Santiago',
    'America/Montevideo',
    'America/Asuncion',
    'America/La_Paz',
    'America/Lima',
    'America/Punta_Arenas',
    'America/Guayaquil',
    'America/Recife',
    'America/Fortaleza',
    'America/Bahia',
    'America/Belem',
    'America/Campo_Grande',
    'America/Cuiaba',
    'America/Manaus',
    'America/Porto_Velho',
    'America/Rio_Branco',
    'America/Santarem',
    'America/Araguaina',
    'America/Maceio',
    'America/Noronha',
    'America/Boa_Vista',
    'America/Eirunepe',
    // Southern Africa
    'Africa/Johannesburg',
    'Africa/Windhoek',
    'Africa/Harare',
    'Africa/Lusaka',
    'Africa/Maputo',
    'Africa/Gaborone',
    'Africa/Luanda',
    'Africa/Lubumbashi',
    'Africa/Blantyre',
    'Africa/Lilongwe',
    'Africa/Mbabane',
    'Africa/Maseru',
    'Africa/Dar_es_Salaam',
    'Africa/Antananarivo',
    // Indian and Atlantic Ocean
    'Indian/Mauritius',
    'Indian/Reunion',
    'Indian/Cocos',
    'Indian/Christmas',
    'Indian/Kerguelen',
    'Indian/Mahe',
    'Indian/Antananarivo',
    'Atlantic/South_Georgia',
    'Atlantic/St_Helena',
]);

/** Whether an IANA timezone identifier is in the southern hemisphere. */
export function isSouthernTimeZone(timeZone: string): boolean {
    if (SOUTHERN_ZONES.has(timeZone)) return true;
    return SOUTHERN_ZONE_PREFIXES.some(prefix => timeZone.startsWith(prefix));
}

/**
 * Resolves the user's hemisphere via the documented fallback chain:
 * granted latitude, then stored timezone, then an explicitly flagged northern assumption.
 */
export function resolveHemisphere(input: HemisphereInput = {}): HemisphereResolution {
    const { latitude, timeZone } = input;

    // 1. Latitude from granted location access.
    if (typeof latitude === 'number' && Number.isFinite(latitude)) {
        return {
            hemisphere: latitude < 0 ? 'southern' : 'northern',
            source: 'latitude',
            isAssumed: false,
        };
    }

    // 2. Inference from the user's stored timezone.
    if (timeZone) {
        return {
            hemisphere: isSouthernTimeZone(timeZone) ? 'southern' : 'northern',
            source: 'timezone',
            isAssumed: false,
        };
    }

    // 3. Nothing to go on. Assume northern, but say so.
    return { hemisphere: 'northern', source: 'assumed', isAssumed: true };
}

/**
 * Resolves hemisphere falling back to the browser's own timezone when no explicit
 * timezone was supplied. Convenience for client-side callers.
 */
export function resolveHemisphereFromEnvironment(
    input: HemisphereInput = {}
): HemisphereResolution {
    if (typeof input.latitude === 'number' && Number.isFinite(input.latitude)) {
        return resolveHemisphere(input);
    }

    if (input.timeZone) return resolveHemisphere(input);

    try {
        const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (browserZone) {
            return resolveHemisphere({ timeZone: browserZone });
        }
    } catch {
        // Intl unavailable — fall through to the assumption.
    }

    return resolveHemisphere({});
}
