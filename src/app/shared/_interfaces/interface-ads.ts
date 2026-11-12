/** public.kampanjer: annonsekampanjene fra Meta. leads.kampanje_id peker på id. Bare kolonnene siden trenger. */
export interface ICampaign {
    id: string;
    /** Metas egen id. Kobler kampanjen til radene i kostnad_daglig. Null på kampanjer som er lagt inn for hånd. */
    meta_kampanje_id: string | null;
    navn: string;
    status: string | null;
}

/** public.kostnad_daglig: forbruk og Metas egne tall for én kampanje på én dag. */
export interface IDailyAdCost {
    /** yyyy-MM-dd */
    dato: string;
    meta_kampanje_id: string;
    kost_nok: number;
    visninger: number;
    /** Antall leads slik Meta teller dem. */
    leads_fb: number;
}

/**
 * Regnestykket for et utvalg leads: kroner brukt i perioden og hva som har skjedd med leadene som kom inn i den.
 * Demo og kunde telles blant de samme leadene, uansett når det skjedde.
 */
export interface IAdSummary {
    spend: number;
    impressions: number;
    /** Leads slik Meta teller dem, til sammenligning med leads. */
    metaLeads: number;
    leads: number;
    demos: number;
    customers: number;
    /** Null når det ikke er noe å dele på. */
    costPerLead: number | null;
    costPerDemo: number | null;
    costPerCustomer: number | null;
}

/** Én kampanje i tabellen. */
export interface IAdCampaignRow extends IAdSummary {
    key: string;
    name: string;
    status: string | null;
}

/** Hvor mye én stolpe i utviklingen dekker. */
export type AdBucketSize = 'day' | 'week' | 'month';

/** Én stolpe i utviklingen: det som falt på disse datoene, hver for seg. Kostnad per kunde regnes ikke her. */
export interface IAdBucket {
    key: string;
    /** Kort tekst under stolpen. */
    label: string;
    /** Full tekst for perioden, til verktøytipset. */
    title: string;
    spend: number;
    leads: number;
    demos: number;
    customers: number;
}
