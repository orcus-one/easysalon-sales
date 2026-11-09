/** Kolonnene oversikten trenger fra public.leads. Tabellen har flere. */
export interface ILead {
    id: string;
    navn: string;
    bedriftsnavn: string | null;
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
