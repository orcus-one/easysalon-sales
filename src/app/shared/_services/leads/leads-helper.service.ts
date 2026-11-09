import { Injectable } from '@angular/core';
import {
    IDashboardKpis, ILead, IPipelineCount, IPipelineStep, ISourceSummary, IUpcomingItem
} from '../../_interfaces/interface-leads';

/**
 * Rene beregninger på leads. Ingen tilstand, ingen kall. Brukes av facadene via computed.
 */
@Injectable({
    providedIn: 'root'
})
export class LeadsHelperService {

    /** Statusen som teller som vunnet i andeler per kilde. */
    static readonly WonStatus = 'vunnet';

    /** Dato som yyyy-MM-dd i lokal tid, samme form som date-kolonnene i basen. */
    toDateKey(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    addDays(date: Date, days: number): Date {
        const copy = new Date(date);
        copy.setDate(copy.getDate() + days);
        return copy;
    }

    kpis(leads: Array<ILead>, now: Date): IDashboardKpis {
        const since30 = this.addDays(now, -30);
        const since30Key = this.toDateKey(since30);
        const todayKey = this.toDateKey(now);

        const wonLast30 = leads.filter(l => l.registrert_dato !== null && l.registrert_dato >= since30Key);

        return {
            total: leads.length,
            newLast30: leads.filter(l => new Date(l.opprettet_ekst) >= since30).length,
            upcomingDemos: leads.filter(l => l.demo_dato !== null && l.demo_dato >= todayKey).length,
            wonLast30: wonLast30.length,
            licensesLast30: wonLast30.reduce((sum, l) => sum + (l.lisenser ?? 0), 0)
        };
    }

    /** Antall per steg i appens rekkefølge. Statuser uten steg legges til sist som ukjente. */
    pipeline(leads: Array<ILead>, steps: Array<IPipelineStep>): Array<IPipelineCount> {
        const counts = new Map<string, number>();
        for (const lead of leads) {
            counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
        }
        const total = leads.length || 1;
        const known = new Set(steps.map(s => s.nokkel));

        const result: Array<IPipelineCount> = steps.map(step => ({
            step,
            count: counts.get(step.nokkel) ?? 0,
            share: (counts.get(step.nokkel) ?? 0) / total
        }));

        for (const [status, count] of counts) {
            if (!known.has(status)) {
                result.push({
                    step: { nokkel: status, label: status, farge: '#9ca3af', rekkefolge: 999, aktiv: true },
                    count,
                    share: count / total
                });
            }
        }
        return result;
    }

    /** Antall og andel vunnet per kilde, største kilde først. */
    bySource(leads: Array<ILead>): Array<ISourceSummary> {
        const groups = new Map<string, { total: number; won: number }>();
        for (const lead of leads) {
            const key = lead.kilde ?? 'Ukjent';
            const group = groups.get(key) ?? { total: 0, won: 0 };
            group.total += 1;
            if (lead.status === LeadsHelperService.WonStatus) group.won += 1;
            groups.set(key, group);
        }
        return [...groups.entries()]
            .map(([kilde, g]) => ({ kilde, total: g.total, won: g.won, wonShare: g.total ? g.won / g.total : 0 }))
            .sort((a, b) => b.total - a.total);
    }

    /** Oppfølginger og demoer fra og med i dag til og med om `days` dager, tidligst først. */
    upcoming(leads: Array<ILead>, now: Date, days: number): Array<IUpcomingItem> {
        const fromKey = this.toDateKey(now);
        const toKey = this.toDateKey(this.addDays(now, days));
        const items: Array<IUpcomingItem> = [];

        for (const lead of leads) {
            if (lead.neste_oppfolging && lead.neste_oppfolging >= fromKey && lead.neste_oppfolging <= toKey) {
                items.push({ lead, date: lead.neste_oppfolging, time: lead.oppfolging_tid, kind: 'followup' });
            }
            if (lead.demo_dato && lead.demo_dato >= fromKey && lead.demo_dato <= toKey) {
                items.push({ lead, date: lead.demo_dato, time: lead.demo_tid, kind: 'demo' });
            }
        }
        return items.sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')));
    }
}
