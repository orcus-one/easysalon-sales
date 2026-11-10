/** Kolonnene oversikten trenger fra public.leads. Tabellen har flere. */
export interface ILead {
    id: string;
    navn: string;
    bedriftsnavn: string | null;
    orgnummer: string | null;
    telefon: string | null;
    epost: string | null;
    kilde: string | null;
    status: string;
    opprettet_ekst: string;
    neste_oppfolging: string | null;
    oppfolging_tid: string | null;
    demo_dato: string | null;
    demo_tid: string | null;
    registrert_dato: string | null;
    lisenser: number | null;
}

/** Et valg i kildelisten: verdien som lagres i leads.kilde og teksten som vises. */
export interface ISourceOption {
    value: string;
    label: string;
}

/** Feltene i skjemaet «Opprett lead». Navnene er kolonnene i leads, tomme felt sendes som null. */
export interface ILeadInput {
    navn: string;
    /** Når leadet kom inn, ISO-tidspunkt. Skjemaet foreslår i dag og lar brukeren sette en annen dato. */
    opprettet_ekst: string;
    bedriftsnavn: string | null;
    orgnummer: string | null;
    telefon: string | null;
    epost: string | null;
    kilde: string | null;
    status: string;
    notater: string | null;
    neste_oppfolging: string | null;
    oppfolging_tid: string | null;
}

/** Én rad i leadlisten: leadet med oppløst steg og første planlagte dato fra og med i dag. */
export interface ILeadListItem {
    lead: ILead;
    step: IPipelineStep;
    next: IUpcomingItem | null;
}

/** public.pipeline_steg: appens egne steg med rekkefølge, etikett og farge. */
export interface IPipelineStep {
    nokkel: string;
    label: string;
    farge: string;
    rekkefolge: number;
    aktiv: boolean;
}

export interface IPipelineCount {
    step: IPipelineStep;
    count: number;
    share: number;
}

export interface ISourceSummary {
    kilde: string;
    /** Visningstekst for kilden, se LeadsHelperService.sourceLabel. */
    label: string;
    total: number;
    won: number;
    wonShare: number;
}

export interface IUpcomingItem {
    lead: ILead;
    date: string;
    time: string | null;
    kind: 'followup' | 'demo';
}

export interface IUpcomingDay {
    date: string;
    items: Array<IUpcomingItem>;
}

/** public.lead_hendelser: loggførte handlinger på et lead. */
export interface ILeadEvent {
    id: string;
    lead_id: string;
    type: string;
    fra_status: string | null;
    til_status: string | null;
    opprettet_at: string;
}

/** Én linje i historikken: hendelsen med leadet og lesbare etiketter. */
export interface IHistoryItem {
    event: ILeadEvent;
    lead: ILead | undefined;
    typeLabel: string;
    fromLabel: string | null;
    toLabel: string | null;
}

export interface IHistoryDay {
    date: string;
    items: Array<IHistoryItem>;
}

/** Én rad i månedsoversikten. */
export interface IMonthlySummary {
    month: string;
    newLeads: number;
    calls: number;
    sms: number;
    meetings: number;
    demos: number;
    won: number;
    licenses: number;
}

export interface IEventTypeOption {
    type: string;
    label: string;
}

export interface IActivitySummary {
    type: string;
    label: string;
    leadsToday: number;
    leadsYesterday: number;
    leadsLast7: number;
    leadsLast14: number;
    leadsLast30: number;
    eventsLast30: number;
}

/** Kontakthendelser per dag, for grafen. */
export interface IDailyActivity {
    date: string;
    ringt: number;
    sms: number;
}

export interface IDashboardKpis {
    total: number;
    newLast30: number;
    upcomingDemos: number;
    wonLast30: number;
    licensesLast30: number;
}

/** Hva slags dag et KPI-kort gjelder. Målet gjelder bare arbeidsdager. */
export type KpiDayKind = 'workday' | 'weekend' | 'holiday';

/** Én dag i KPI-måneden: antall telefoner og om målet ble nådd. */
export interface IKpiDay {
    date: string;
    dayOfMonth: number;
    kind: KpiDayKind;
    /** Navnet på helligdagen, ellers null. */
    holidayName: string | null;
    /** Dagen er etter i dag og vises uten tall. */
    isFuture: boolean;
    isToday: boolean;
    calls: number;
    /** Arbeidsdag til og med i dag med minst målet i telefoner. Alltid false for andre dager. */
    met: boolean;
}

/** En måned i KPI-visningen med dagene i kalenderorden og oppsummering for arbeidsdagene som er passert. */
export interface IKpiMonth {
    /** yyyy-MM */
    month: string;
    /** Tomme celler før den første, så den første havner på riktig ukedag (mandag først). */
    leadingBlanks: number;
    days: Array<IKpiDay>;
    workdaysPassed: number;
    daysMet: number;
    callsOnWorkdays: number;
    /** Telefoner per arbeidsdag som er passert, 0 når ingen er passert. */
    averageCalls: number;
}

/** Nivåene under KPI. */
export type KpiView = 'calls' | 'demos';

/** Én ISO-uke i KPI-visningen for demoer. */
export interface IKpiWeek {
    week: number;
    /** Første og siste dag i uken som yyyy-MM-dd. */
    start: string;
    end: string;
    /** Uken begynner etter i dag. Viser bookede demoer uten rødt eller grønt. */
    isFuture: boolean;
    isCurrent: boolean;
    demos: number;
    /** Uke til og med denne med minst målet i demoer. Alltid false for uker frem i tid. */
    met: boolean;
}

/** Alle ISO-ukene i et år med oppsummering for ukene til og med denne. */
export interface IKpiYear {
    year: number;
    weeks: Array<IKpiWeek>;
    weeksPassed: number;
    weeksMet: number;
    demosOnPassedWeeks: number;
    /** Demoer per uke til og med denne, 0 når ingen er passert. */
    averageDemos: number;
    /** Alle demoer med demodato i årets uker, også bookede fremover. */
    demosTotal: number;
}
