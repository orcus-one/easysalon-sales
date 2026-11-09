/** Kolonnene oversikten trenger fra public.leads. Tabellen har flere. */
export interface ILead {
    id: string;
    navn: string;
    bedriftsnavn: string | null;
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

/** public.lead_hendelser: loggførte handlinger på et lead. */
export interface ILeadEvent {
    lead_id: string;
    type: string;
    opprettet_at: string;
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
