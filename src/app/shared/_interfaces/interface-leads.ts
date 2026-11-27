/** Kolonnene oversikten trenger fra public.leads. Tabellen har flere. */
export interface ILead {
    id: string;
    navn: string;
    bedriftsnavn: string | null;
    orgnummer: string | null;
    telefon: string | null;
    epost: string | null;
    /** Peker på sources.id. Null på leads som er lagt inn med bare den gamle teksten. */
    source_id: number | null;
    /** Den gamle tekstkolonnen. Leses til selgerens app skriver source_id, og fjernes da. */
    kilde: string | null;
    /** Peker på kampanjer.id. Satt på leads som kom fra en annonse på Meta, ellers null. */
    kampanje_id: string | null;
    status: string;
    opprettet_ekst: string;
    neste_oppfolging: string | null;
    oppfolging_tid: string | null;
    demo_dato: string | null;
    demo_tid: string | null;
    registrert_dato: string | null;
    lisenser: number | null;
}

/** public.sources: hvor leadene kommer fra. leads.source_id peker hit. Nye tabeller har engelske navn. */
export interface ISource {
    id: number;
    key: string;
    label: string;
    sort_order: number;
    active: boolean;
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
    source_id: number | null;
    status: string;
    notater: string | null;
    neste_oppfolging: string | null;
    oppfolging_tid: string | null;
}

/** Raden som settes inn: skjemaet pluss det fasaden legger på. */
export interface ILeadInsert extends ILeadInput {
    org_id: string;
    /** Kildens visningstekst i den gamle tekstkolonnen, så selgerens app viser kilden til den leser source_id. */
    kilde: string | null;
}

/** Én rad i leadlisten: leadet med oppløst steg, kildens visningstekst og første planlagte dato fra og med i dag. */
export interface ILeadListItem {
    lead: ILead;
    step: IPipelineStep;
    source: string;
    next: IUpcomingItem | null;
}

/** public.organisasjoner: selgerens organisasjon. Bare id hentes; leads.org_id peker hit. */
export interface IOrganisation {
    id: string;
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

/** Et valg i kildefilteret på Leads-siden: kildens visningstekst slik den står på radene, og antall leads. */
export interface ISourceCount {
    source: string;
    /** Teksten på knappen. Lik source, bortsett fra for leads uten kilde. */
    label: string;
    count: number;
}

export interface ISourceSummary {
    /** Visningstekst for kilden, se LeadsHelperService.sourceLabel. Leadene grupperes på den. */
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

/**
 * Raden som settes inn i lead_hendelser. Id settes av basen, og tidspunktet også når opprettet_at utelates.
 * opprettet_at sendes bare med når en demo etterregistreres på en eldre dato.
 */
export interface ILeadEventInsert {
    org_id: string;
    lead_id: string;
    type: string;
    fra_status?: string;
    til_status?: string;
    opprettet_at?: string;
}

/** Leadet slik detaljvisningen henter det: listekolonnene pluss notat og tidspunkter. */
export interface ILeadDetail extends ILead {
    notater: string | null;
    forst_kontakt_at: string | null;
    oppdatert_at: string | null;
}

/** Hendelse med kommentaren, hentet per lead for livsløpet. */
export interface ILeadEventDetail extends ILeadEvent {
    kommentar: string | null;
}

/** public.lead_notes: notater på et lead, ett per rad. Bare lesing og oppretting, notater endres ikke. */
export interface ILeadNote {
    id: number;
    lead_id: string;
    body: string;
    created_at: string;
    /** E-posten til den innloggede som skrev notatet, satt av basen. Null når notatet ikke er skrevet fra Hermes. */
    created_by_email: string | null;
}

/** Raden som settes inn i lead_notes. Tidspunkt og forfatter settes av basen. */
export interface ILeadNoteInsert {
    org_id: string;
    lead_id: string;
    body: string;
}

/** Leadet notatdialogen gjelder. */
export interface INoteTarget {
    id: string;
    navn: string;
}

/** Leadet dialogen «Demo gjennomført» gjelder. */
export interface IDemoTarget {
    id: string;
    navn: string;
}

/** Én linje i livsløpet til et lead: en hendelse, et notat (type «note») eller opprettelsen (type «opprettet»). */
export interface ILifecycleItem {
    id: string;
    /** ISO-tidspunkt. */
    at: string;
    type: string;
    label: string;
    fromLabel: string | null;
    toLabel: string | null;
    comment: string | null;
    /** Hvem som skrev notatet. Null for hendelser og for notater uten forfatter. */
    author: string | null;
}

/** Antall hendelser av én type på et lead. */
export interface ILifecycleCount {
    type: string;
    label: string;
    count: number;
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

export interface IDashboardKpis {
    total: number;
    newLast30: number;
    upcomingDemos: number;
    wonLast30: number;
    licensesLast30: number;
}

/** Telefonene i inneværende uke, mandag til søndag, målt mot ukemålet (dagsmålet ganger arbeidsdagene i uken). */
export interface ICallWeek {
    /** Leads ringt i uken til og med i dag. Helg teller med. */
    calls: number;
    /** Dagsmålet ganger arbeidsdagene i uken: 125 i en vanlig uke, lavere i en uke med helligdag. */
    target: number;
    /** Hvor mange som mangler til ukemålet, aldri under 0. */
    remaining: number;
    /**
     * Foran (positivt) eller etter (negativt) skjema ved starten av dagen: telefonene på dagene før i dag mot
     * dagsmålet for arbeidsdagene som er passert. Dagen i dag er ikke med, siden den ikke er ferdig.
     */
    balance: number;
    /** Arbeidsdager igjen i uken, i dag medregnet. */
    workdaysLeft: number;
    /**
     * Dagsmålet for hver arbeidsdag som er igjen, i dag medregnet, for å nå ukemålet: det som manglet ved
     * starten av dagen, fordelt jevnt og rundet opp. 0 når ingen arbeidsdager er igjen.
     */
    dailyNeed: number;
    /** Hvor mange som mangler i dag for å nå dailyNeed, aldri under 0. null når dagen i dag ikke er arbeidsdag. */
    todayRemaining: number | null;
}

/** Telefonkontoen: løpende saldo siden start, der hver arbeidsdag trekker dagsmålet og hver telefon setter inn 1. */
export interface ICallAccount {
    /** Første dag på kontoen, yyyy-MM-dd. */
    start: string;
    /** Telefoner minus krav til og med i dag. Dagens trekk er med fra morgenen. */
    balance: number;
    calls: number;
    required: number;
    workdaysPassed: number;
    /** Arbeidsdager der dagsmålet ble nådd. */
    daysMet: number;
    /** Hvor mange telefoner som mangler i dag for å være i balanse i kveld. null når dagen i dag ikke er arbeidsdag. */
    todayToBalance: number | null;
    /** Arbeidsdager på det han bør sikte på som henter inn minusen fra starten av dagen. 0 når kontoen ikke var i minus. */
    daysToBalance: number;
    weeks: Array<ICallAccountWeek>;
}

/** Én uke på telefonkontoen, til og med i dag for inneværende uke. */
export interface ICallAccountWeek {
    week: number;
    /** Mandagen i uken, yyyy-MM-dd. */
    start: string;
    calls: number;
    required: number;
    /** Telefoner minus krav i uken. */
    change: number;
    /** Saldoen ved utgangen av uken. */
    balance: number;
    daysMet: number;
    /** Arbeidsdager i hele uken, også de som ikke er passert. */
    workdays: number;
    isCurrent: boolean;
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
    /** Demoer merket gjennomført i uken, lagt på dagen de ble registrert. Et lead teller én gang per dag. */
    completed: number;
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
    /** Demoer merket gjennomført i årets uker. */
    completedTotal: number;
}
