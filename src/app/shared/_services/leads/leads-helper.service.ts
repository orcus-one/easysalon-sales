import { Injectable } from '@angular/core';
import {
    IActivitySummary, IDailyActivity, IDashboardKpis, IEventTypeOption, IHistoryItem, ILead, ILeadEvent, IMonthlySummary, IPipelineCount,
    IPipelineStep, ISourceSummary, IUpcomingItem
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

    /** Hendelsestypene i lead_hendelser med lesbar etikett, i visningsrekkefølge. */
    static readonly EventTypes: Array<IEventTypeOption> = [
        { type: 'ringt_klikk', label: 'Ringt' },
        { type: 'sms_klikk', label: 'SMS' },
        { type: 'epost_klikk', label: 'E-post' },
        { type: 'mote_klikk', label: 'Møte' },
        { type: 'status_endret', label: 'Status endret' },
        { type: 'notat_endret', label: 'Notat endret' }
    ];

    eventTypeLabel(type: string): string {
        return LeadsHelperService.EventTypes.find(t => t.type === type)?.label ?? type;
    }

    /** yyyy-MM i lokal tid. */
    toMonthKey(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    /** Innsats og resultat per måned fra januar i år til og med inneværende måned. */
    monthly(leads: Array<ILead>, events: Array<ILeadEvent>, now: Date): Array<IMonthlySummary> {
        const months = new Map<string, IMonthlySummary>();
        for (let m = 0; m <= now.getMonth(); m++) {
            const key = this.toMonthKey(new Date(now.getFullYear(), m, 1));
            months.set(key, { month: key, newLeads: 0, calls: 0, sms: 0, meetings: 0, demos: 0, won: 0, licenses: 0 });
        }
        const monthOf = (value: string) => value.slice(0, 7);

        for (const lead of leads) {
            const created = months.get(this.toMonthKey(new Date(lead.opprettet_ekst)));
            if (created) created.newLeads += 1;
            if (lead.demo_dato) {
                const demo = months.get(monthOf(lead.demo_dato));
                if (demo) demo.demos += 1;
            }
            if (lead.registrert_dato) {
                const won = months.get(monthOf(lead.registrert_dato));
                if (won) {
                    won.won += 1;
                    won.licenses += lead.lisenser ?? 0;
                }
            }
        }
        for (const e of events) {
            const row = months.get(this.toMonthKey(new Date(e.opprettet_at)));
            if (!row) continue;
            if (e.type === 'ringt_klikk') row.calls += 1;
            if (e.type === 'sms_klikk') row.sms += 1;
            if (e.type === 'mote_klikk') row.meetings += 1;
        }
        return [...months.values()];
    }

    /** Hendelser i perioden med lead og etiketter, nyeste først. */
    history(events: Array<ILeadEvent>, leads: Array<ILead>, steps: Array<IPipelineStep>, now: Date, days: number): Array<IHistoryItem> {
        const since = this.addDays(now, -days);
        const leadById = new Map(leads.map(l => [l.id, l]));
        const stepLabel = new Map(steps.map(s => [s.nokkel, s.label]));
        return events
            .filter(e => new Date(e.opprettet_at) >= since)
            .map(e => ({
                event: e,
                lead: leadById.get(e.lead_id),
                typeLabel: this.eventTypeLabel(e.type),
                fromLabel: e.fra_status ? (stepLabel.get(e.fra_status) ?? e.fra_status) : null,
                toLabel: e.til_status ? (stepLabel.get(e.til_status) ?? e.til_status) : null
            }))
            .sort((a, b) => b.event.opprettet_at.localeCompare(a.event.opprettet_at));
    }

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

    /** Unike leads kontaktet per type i dag, i går og siste 7, 14 og 30 dager, i fast rekkefølge. */
    activity(events: Array<ILeadEvent>, now: Date): Array<IActivitySummary> {
        const todayKey = this.toDateKey(now);
        const yesterdayKey = this.toDateKey(this.addDays(now, -1));
        const since7 = this.addDays(now, -7);
        const since14 = this.addDays(now, -14);
        const since30 = this.addDays(now, -30);
        const labels: Array<[string, string]> = [
            ['ringt_klikk', 'Ringt'],
            ['sms_klikk', 'SMS'],
            ['epost_klikk', 'E-post'],
            ['mote_klikk', 'Møte']
        ];
        return labels.map(([type, label]) => {
            const ofType = events.filter(e => e.type === type);
            const last30 = ofType.filter(e => new Date(e.opprettet_at) >= since30);
            const last14 = last30.filter(e => new Date(e.opprettet_at) >= since14);
            const last7 = last14.filter(e => new Date(e.opprettet_at) >= since7);
            const today = last7.filter(e => this.toDateKey(new Date(e.opprettet_at)) === todayKey);
            const yesterday = last7.filter(e => this.toDateKey(new Date(e.opprettet_at)) === yesterdayKey);
            return {
                type,
                label,
                leadsToday: new Set(today.map(e => e.lead_id)).size,
                leadsYesterday: new Set(yesterday.map(e => e.lead_id)).size,
                leadsLast7: new Set(last7.map(e => e.lead_id)).size,
                leadsLast14: new Set(last14.map(e => e.lead_id)).size,
                leadsLast30: new Set(last30.map(e => e.lead_id)).size,
                eventsLast30: last30.length
            };
        });
    }

    /** Ringt og SMS per dag de siste days dagene til og med i dag, med nuller for dager uten. */
    dailyActivity(events: Array<ILeadEvent>, now: Date, days: number): Array<IDailyActivity> {
        const byDay = new Map<string, IDailyActivity>();
        for (let i = days - 1; i >= 0; i--) {
            const key = this.toDateKey(this.addDays(now, -i));
            byDay.set(key, { date: key, ringt: 0, sms: 0 });
        }
        for (const e of events) {
            const day = byDay.get(this.toDateKey(new Date(e.opprettet_at)));
            if (!day) continue;
            if (e.type === 'ringt_klikk') day.ringt += 1;
            if (e.type === 'sms_klikk') day.sms += 1;
        }
        return [...byDay.values()];
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
