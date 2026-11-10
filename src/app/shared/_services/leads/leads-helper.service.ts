import { Injectable } from '@angular/core';
import {
    IActivitySummary, IDailyActivity, IDashboardKpis, IEventTypeOption, IHistoryItem, IKpiDay, IKpiMonth, IKpiWeek, IKpiYear, ILead, ILeadEvent,
    ILeadListItem, IMonthlySummary, IPipelineCount, IPipelineStep, ISourceSummary, IUpcomingItem
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

    /**
     * Kilder som lagres som nøkkel i leads.kilde og trenger egen visningstekst. De eldre kildene (Brønnøysund,
     * Meta, Konkurrent, Onboarding) er lagret med visningsteksten som verdi og trenger ingen oppføring.
     */
    static readonly SourceLabels: ReadonlyMap<string, string> = new Map([
        ['organisk_registrering', 'Organisk registrering']
    ]);

    sourceLabel(kilde: string | null): string {
        if (kilde === null) return '–';
        return LeadsHelperService.SourceLabels.get(kilde) ?? kilde;
    }

    /** Steg for en status som ikke finnes i pipeline_steg. Grå, sist i rekkefølgen. */
    unknownStep(status: string): IPipelineStep {
        return { nokkel: status, label: status, farge: '#9ca3af', rekkefolge: 999, aktiv: true };
    }

    /**
     * Leadlisten: alle leads nyeste først, med steget sitt og første planlagte dato (oppfølging eller demo)
     * fra og med i dag. Datoer som er passert vises ikke som planlagt.
     */
    leadList(leads: Array<ILead>, steps: Array<IPipelineStep>, now: Date): Array<ILeadListItem> {
        const todayKey = this.toDateKey(now);
        const stepByKey = new Map(steps.map(s => [s.nokkel, s]));
        return leads
            .map(lead => {
                const planned: Array<IUpcomingItem> = [];
                if (lead.neste_oppfolging && lead.neste_oppfolging >= todayKey) {
                    planned.push({ lead, date: lead.neste_oppfolging, time: lead.oppfolging_tid, kind: 'followup' });
                }
                if (lead.demo_dato && lead.demo_dato >= todayKey) {
                    planned.push({ lead, date: lead.demo_dato, time: lead.demo_tid, kind: 'demo' });
                }
                planned.sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')));
                return { lead, step: stepByKey.get(lead.status) ?? this.unknownStep(lead.status), next: planned[0] ?? null };
            })
            .sort((a, b) => b.lead.opprettet_ekst.localeCompare(a.lead.opprettet_ekst));
    }

    /**
     * Fritekstsøk på navn, firma, e-post, telefon og organisasjonsnummer. query er allerede trimmet og i små
     * bokstaver. Organisasjonsnummer sammenlignes uten mellomrom, så «123 456» treffer «123456789».
     */
    leadMatches(lead: ILead, query: string): boolean {
        const compact = query.replace(/\s+/g, '');
        return [lead.navn, lead.bedriftsnavn, lead.epost, lead.telefon]
            .some(value => value !== null && value.toLowerCase().includes(query))
            || (compact !== '' && this.orgNumberDigits(lead.orgnummer).includes(compact));
    }

    private orgNumberDigits(orgnummer: string | null): string {
        return (orgnummer ?? '').replace(/\D/g, '');
    }

    /** Organisasjonsnummer med mellomrom, «123 456 789». Andre lengder vises som de er. */
    formatOrgNumber(orgnummer: string | null): string {
        const digits = this.orgNumberDigits(orgnummer);
        return digits.length === 9 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : (orgnummer ?? '');
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

    /**
     * Norske offentlige høytidsdager 2026 til 2028 som statisk liste (Kenneth 2026-11-10). Må fylles på
     * før 2029. Bevegelige dager er regnet fra påskedag: 5. april 2026, 28. mars 2027 og 16. april 2028.
     */
    static readonly Holidays: ReadonlyMap<string, string> = new Map([
        ['2026-01-01', 'Første nyttårsdag'], ['2026-04-02', 'Skjærtorsdag'], ['2026-04-03', 'Langfredag'],
        ['2026-04-05', 'Første påskedag'], ['2026-04-06', 'Andre påskedag'], ['2026-05-01', 'Arbeidernes dag'],
        ['2026-05-14', 'Kristi himmelfartsdag'], ['2026-05-17', 'Grunnlovsdagen'], ['2026-05-24', 'Første pinsedag'],
        ['2026-05-25', 'Andre pinsedag'], ['2026-12-25', 'Første juledag'], ['2026-12-26', 'Andre juledag'],

        ['2027-01-01', 'Første nyttårsdag'], ['2027-03-25', 'Skjærtorsdag'], ['2027-03-26', 'Langfredag'],
        ['2027-03-28', 'Første påskedag'], ['2027-03-29', 'Andre påskedag'], ['2027-05-01', 'Arbeidernes dag'],
        ['2027-05-06', 'Kristi himmelfartsdag'], ['2027-05-16', 'Første pinsedag'], ['2027-05-17', 'Grunnlovsdagen og andre pinsedag'],
        ['2027-12-25', 'Første juledag'], ['2027-12-26', 'Andre juledag'],

        ['2028-01-01', 'Første nyttårsdag'], ['2028-04-13', 'Skjærtorsdag'], ['2028-04-14', 'Langfredag'],
        ['2028-04-16', 'Første påskedag'], ['2028-04-17', 'Andre påskedag'], ['2028-05-01', 'Arbeidernes dag'],
        ['2028-05-17', 'Grunnlovsdagen'], ['2028-05-25', 'Kristi himmelfartsdag'], ['2028-06-04', 'Første pinsedag'],
        ['2028-06-05', 'Andre pinsedag'], ['2028-12-25', 'Første juledag'], ['2028-12-26', 'Andre juledag']
    ]);

    /**
     * Telefoner per dag i én måned målt mot et dagsmål. Helg og helligdag er med i rutenettet for at ukene
     * skal stemme, men teller ikke mot målet. Dager etter i dag vises uten tall. Oppsummeringen gjelder
     * arbeidsdagene til og med i dag.
     */
    callKpiMonth(events: Array<ILeadEvent>, year: number, monthIndex: number, target: number, now: Date): IKpiMonth {
        const todayKey = this.toDateKey(now);
        const monthKey = this.toMonthKey(new Date(year, monthIndex, 1));
        const callsByDay = new Map<string, number>();
        for (const e of events) {
            if (e.type !== 'ringt_klikk') continue;
            const key = this.toDateKey(new Date(e.opprettet_at));
            if (key.startsWith(monthKey)) callsByDay.set(key, (callsByDay.get(key) ?? 0) + 1);
        }

        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const days: Array<IKpiDay> = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, monthIndex, d);
            const key = this.toDateKey(date);
            const holidayName = LeadsHelperService.Holidays.get(key) ?? null;
            const weekday = date.getDay();
            const kind = holidayName ? 'holiday' : (weekday === 0 || weekday === 6) ? 'weekend' : 'workday';
            const isFuture = key > todayKey;
            const calls = callsByDay.get(key) ?? 0;
            days.push({
                date: key, dayOfMonth: d, kind, holidayName, isFuture, isToday: key === todayKey, calls,
                met: kind === 'workday' && !isFuture && calls >= target
            });
        }

        const passed = days.filter(day => day.kind === 'workday' && !day.isFuture);
        const callsOnWorkdays = passed.reduce((sum, day) => sum + day.calls, 0);
        // getDay gir søndag = 0; vi vil ha mandag først.
        const leadingBlanks = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
        return {
            month: monthKey,
            leadingBlanks,
            days,
            workdaysPassed: passed.length,
            daysMet: passed.filter(day => day.met).length,
            callsOnWorkdays,
            averageCalls: passed.length === 0 ? 0 : callsOnWorkdays / passed.length
        };
    }

    /** Mandagen i ISO-uke 1: 4. januar er alltid i uke 1. */
    private isoWeekOneStart(year: number): Date {
        const jan4 = new Date(year, 0, 4);
        return this.addDays(jan4, -((jan4.getDay() + 6) % 7));
    }

    /** Antall ISO-uker i året, 52 eller 53. 28. desember er alltid i årets siste uke. */
    isoWeeksInYear(year: number): number {
        const dec28 = new Date(year, 11, 28);
        const diffDays = Math.round((dec28.getTime() - this.isoWeekOneStart(year).getTime()) / 86_400_000);
        return Math.floor(diffDays / 7) + 1;
    }

    /**
     * Demoer per ISO-uke i ett år målt mot et ukemål. Demoer telles på demo_dato, så uker frem i tid viser det
     * som er booket. Inneværende uke regnes som passert og måles mot målet. Uke 1 kan begynne i desember
     * året før og siste uke kan slutte i januar året etter; demoer der telles i den uken.
     */
    demoKpiYear(leads: Array<ILead>, year: number, target: number, now: Date): IKpiYear {
        const todayKey = this.toDateKey(now);
        const weekOneStart = this.isoWeekOneStart(year);
        const weeks: Array<IKpiWeek> = [];
        for (let w = 1; w <= this.isoWeeksInYear(year); w++) {
            const startDate = this.addDays(weekOneStart, (w - 1) * 7);
            const start = this.toDateKey(startDate);
            const end = this.toDateKey(this.addDays(startDate, 6));
            const demos = leads.filter(l => l.demo_dato !== null && l.demo_dato >= start && l.demo_dato <= end).length;
            const isFuture = start > todayKey;
            weeks.push({ week: w, start, end, isFuture, isCurrent: start <= todayKey && todayKey <= end, demos, met: !isFuture && demos >= target });
        }
        const passed = weeks.filter(week => !week.isFuture);
        const demosOnPassedWeeks = passed.reduce((sum, week) => sum + week.demos, 0);
        return {
            year,
            weeks,
            weeksPassed: passed.length,
            weeksMet: passed.filter(week => week.met).length,
            demosOnPassedWeeks,
            averageDemos: passed.length === 0 ? 0 : demosOnPassedWeeks / passed.length,
            demosTotal: weeks.reduce((sum, week) => sum + week.demos, 0)
        };
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
                    step: this.unknownStep(status),
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
            .map(([kilde, g]) => ({ kilde, label: this.sourceLabel(kilde), total: g.total, won: g.won, wonShare: g.total ? g.won / g.total : 0 }))
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
