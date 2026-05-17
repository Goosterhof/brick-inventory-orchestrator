/**
 * BrickLink Wanted List XML generation.
 *
 * Reference: https://www.bricklink.com/help.asp?helpID=207
 *
 * A BrickLink wanted list is a flat `<INVENTORY>` of `<ITEM>` elements. The only
 * required fields for our use case are `ITEMTYPE`, `ITEMID` and `MINQTY`. `COLOR`
 * is optional and we intentionally omit it when a BrickLink colour id is not
 * available — see the caveat at the bottom of this file.
 */

export interface BrickLinkWantedListEntry {
    /** Rebrickable part number (for example "3001" or "3004pr0001"). */
    partNum: string;
    /** BrickLink colour id, when mappable. Omit to produce a colour-agnostic entry. */
    brickLinkColorId?: number | null;
    /** Shortfall quantity — the amount the user is still missing. */
    shortfall: number;
}

const escapeXml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const renderItem = (entry: BrickLinkWantedListEntry): string | null => {
    if (entry.shortfall <= 0) {
        return null;
    }

    const lines = [
        '    <ITEM>',
        '        <ITEMTYPE>P</ITEMTYPE>',
        `        <ITEMID>${escapeXml(entry.partNum)}</ITEMID>`,
    ];

    if (entry.brickLinkColorId !== null && entry.brickLinkColorId !== undefined) {
        lines.push(`        <COLOR>${String(entry.brickLinkColorId)}</COLOR>`);
    }

    lines.push(`        <MINQTY>${String(entry.shortfall)}</MINQTY>`, '    </ITEM>');

    return lines.join('\n');
};

/**
 * Build the BrickLink wanted-list XML payload.
 *
 * Entries with a non-positive shortfall are skipped; they would be illegal in
 * BrickLink's schema anyway. Entries without a BrickLink colour id render
 * without a `<COLOR>` element — the user can filter by colour inside BrickLink.
 */
export const toBrickLinkWantedListXml = (entries: readonly BrickLinkWantedListEntry[]): string => {
    const items = entries.map(renderItem).filter((item): item is string => item !== null);
    return ['<?xml version="1.0" encoding="UTF-8"?>', '<INVENTORY>', ...items, '</INVENTORY>'].join('\n');
};

/**
 * Trigger a BrickLink wanted-list XML file download in the browser.
 */
export const downloadBrickLinkWantedList = (xml: string, filename: string): void => {
    const blob = new Blob([xml], {type: 'application/xml;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

/*
 * CAVEAT — BrickLink colour id mapping:
 * Rebrickable colour ids and BrickLink colour ids are not 1:1. Rebrickable
 * publishes a `colors.csv` dataset with an `external_ids` column that carries
 * the BrickLink mapping, but we do not ship that lookup table on the frontend
 * today. Until the mapping is available (future fullstack shipping order), the
 * backend response is expected to either omit colour information or supply
 * `null` for `brickLinkColorId`, and this helper simply skips `<COLOR>` rather
 * than guess. A missing COLOR element yields a BrickLink entry the user can
 * filter by colour themselves; a wrong COLOR buys the wrong bricks.
 */
