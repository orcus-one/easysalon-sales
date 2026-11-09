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

export interface IDashboardKpis {
    total: number;
    newLast30: number;
    upcomingDemos: number;
    wonLast30: number;
    licensesLast30: number;
}
